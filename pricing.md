# Memories in Prints — Logged-In Custom Pricing Feature

## Context for the model
Existing Next.js (App Router) / TypeScript site with Neon (Postgres) as the database and a login system for customer accounts (migrating to Better Auth — check current state of that migration before starting, and build this feature against whatever auth system is live). Do not change the pricing section's current appearance or behavior for logged-out visitors.

## Goal
The Pricing section should behave differently depending on login state:
- **Not logged in:** exactly the current behavior — no change.
- **Logged in, no negotiated price set yet:** pricing area shows a clear "pending" state, not an error and not a fake price.
- **Logged in, negotiated price set:** shows that customer's specific price.
- Admin must be able to set a customer's price after a negotiation, and update/change it again later at any time — changes must reflect the next time that customer views the pricing section.

---

## 1. Data model
Add a table (Drizzle schema) for customer-specific pricing, separate from any general/public pricing data:

```
customer_prices
- id
- user_id           (foreign key -> users)
- product_id         (foreign key -> products/services, if pricing is per-product; omit if it's a single flat negotiated rate per customer)
- price              (nullable — null means "not yet set")
- currency
- set_by             (admin user id who last set/changed it)
- updated_at
- created_at
```

- `price` must be nullable. A row not existing yet, or existing with `price = null`, both represent "not negotiated yet" — pick one approach and be consistent (recommend: no row until a price is set, to keep "pending" simple).
- Keep a full history if you want an audit trail of price changes (optional `customer_price_history` table logging old price, new price, changed_by, changed_at) — implement this if straightforward, otherwise skip and rely on `updated_at`.

## 2. Server-side access control (critical)
- The pricing section must fetch the logged-in user's price **server-side** (Server Component or Server Action), reading the session on the server — never trust a client-supplied user ID.
- A logged-in customer must only ever be able to see their **own** price. Confirm this with a test: log in as customer A, attempt to request customer B's price via any client-callable path, confirm it's rejected.
- Only admin-role accounts can write to `customer_prices`. Enforce this at the query/action level, not just by hiding the UI button.

## 3. Frontend states
Build three explicit UI states for the pricing section:
1. **Logged out** — current design, unchanged.
2. **Logged in, no price row / price is null** — show a clear message, e.g. "Your custom pricing is being prepared — we'll notify you once it's ready" (wording can be adjusted, but it must not look broken or show £0 / blank number).
3. **Logged in, price set** — display the price clearly in the existing pricing layout/design, styled consistently with the rest of the section.

## 4. Admin interface to set/update prices
Add a simple internal admin view (route protected to admin role only) where an admin can:
- Search/select a customer by name or email.
- Enter or update their negotiated price (and product, if pricing is per-product).
- Save — this writes to `customer_prices` and updates `updated_at` / `set_by`.
- This must support **editing an existing price**, not just creating one — negotiations can change later, and the customer's view must reflect the latest value.

If there's already an internal admin area in the codebase, add this as a new section within it rather than building a separate admin app.

## 5. Optional: notify the customer when pricing is ready
- When an admin sets a price for the first time (row goes from not-existing to existing), optionally trigger a Resend email to that customer letting them know their pricing is now available.
- Do not send this email on every subsequent price update unless explicitly wanted — decide with the business owner whether price *changes* (not just the first-time set) should also notify the customer.

## 6. Testing checklist
- [ ] Logged-out pricing section is pixel-identical to current behavior.
- [ ] Newly logged-in customer with no price row sees the pending state, not an error or a blank/zero price.
- [ ] Admin can set a price for a customer and it appears correctly on that customer's next view of the pricing section.
- [ ] Admin can edit an already-set price and the change is reflected (no caching issue showing a stale price).
- [ ] Customer A cannot see Customer B's price under any circumstance (verify via direct testing, not just UI inspection).
- [ ] Non-admin accounts cannot access the admin pricing route or call the price-setting action, even if they know the URL/endpoint.
- [ ] If per-product pricing is used, confirm the correct price shows against the correct product, not mismatched.