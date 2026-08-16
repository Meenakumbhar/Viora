# Memories in Prints — Backend & Stack Upgrade Plan

## Context for the model
This is an existing Next.js 16 (App Router) application, written in TypeScript, using React 19, Tailwind v4, Neon (serverless Postgres), Vercel hosting, Cloudflare R2 for storage, PayPal for payments, and Resend for email. Auth is currently a custom HMAC-signed cookie session system. Supabase is present as a legacy dependency being phased out. Animation is handled by GSAP + ScrollTrigger, Framer Motion, Lenis, and Three.js.

Do not change the framework, language, or hosting provider. This is a targeted hardening and modernization pass, not a rewrite. Implement changes incrementally, one concern at a time, and keep the app deployable after each step.

---

## Priority 1 — Replace custom auth with Better Auth

**Why:** hand-rolled session/cookie crypto is the highest-risk part of the current stack. Better Auth is a TypeScript-native, self-hosted auth library that stores users in our own Postgres (Neon) and gives us maintained session handling, CSRF protection, token rotation, and optional 2FA/passkeys without owning the crypto ourselves.

Tasks:
1. Install `better-auth` and its Next.js adapter.
2. Design the auth schema (users, sessions, accounts) to live in the existing Neon database.
3. Migrate existing user records and active sessions from the current HMAC-cookie system to Better Auth's session model. Write a migration script; do not silently invalidate all logged-in users if avoidable.
4. Replace all reads/writes of the custom session cookie (in middleware, server actions, and API routes) with Better Auth's session helpers.
5. Add email/password + at least one OAuth provider if the app currently supports social login.
6. Remove the old HMAC signing/verification code entirely once migration is verified — no dead auth code should remain.
7. Write tests confirming: unauthenticated requests are rejected, sessions expire correctly, and session tokens can't be forged or replayed.

---

## Priority 2 — Add Drizzle ORM

**Why:** type-safe queries against Neon, single source of truth for the DB schema shared with Better Auth, removes hand-written SQL string risk (injection surface).

Tasks:
1. Install `drizzle-orm` and `drizzle-kit`, configure for the Neon serverless driver.
2. Define schema files for all existing tables (introspect the current Neon DB if no schema currently exists in code).
3. Replace all raw SQL queries / direct DB client calls with Drizzle queries.
4. Set up `drizzle-kit` migrations as the source of truth for schema changes going forward.
5. Confirm Better Auth's Drizzle adapter is used so auth tables and app tables share one schema definition.

---

## Priority 3 — Add Zod validation at every input boundary

**Why:** TypeScript's types are compile-time only — they do nothing to validate real runtime input from forms, webhooks, file uploads, or third-party payloads (PayPal, Resend webhooks, etc.). This is the actual security gap in a TypeScript backend.

Tasks:
1. Install `zod`.
2. Define a schema for every Server Action's input, every API route's request body, and every incoming webhook payload (PayPal, Resend).
3. Reject and log invalid input before it touches the database or triggers side effects (emails, payments).
4. Where forms already exist client-side, share the same Zod schema on the client for consistent validation messaging.

---

## Priority 4 — Add Stripe alongside PayPal

**Why:** the business is expanding into UK, Canada, Australia, and New Zealand. Stripe has stronger multi-currency support, localized payment methods, and tax handling (Stripe Tax) for international customers than PayPal alone. Keep PayPal — this is additive, not a replacement.

Tasks:
1. Install the Stripe SDK, add API keys via environment variables (never hardcoded).
2. Implement Stripe Checkout or Payment Intents for the existing purchase flow, in parallel with the current PayPal flow.
3. Let the customer choose payment method at checkout.
4. Verify all Stripe webhook signatures server-side before processing events.
5. Reconcile order/payment records so both payment providers write to the same order schema.

---

## Priority 5 — Audit and consolidate the animation stack

**Why:** GSAP + ScrollTrigger + Framer Motion + Lenis + Three.js together is significant bundle weight for a marketing/design-studio site. Not a security issue, but a performance and maintainability one.

Tasks:
1. Inventory every current use of each animation library across the codebase.
2. Decide ownership: GSAP + ScrollTrigger for scroll-driven animation, Framer Motion (Motion) for React component transitions — avoid using both for the same kind of animation.
3. Confirm Three.js is only included on pages that actually render 3D content; lazy-load it so it never ships on pages that don't use it.
4. Remove any library that ends up unused after this audit.
5. Re-measure bundle size before/after and report the difference.

---

## Priority 6 — Testing

Tasks:
1. Install Vitest for unit/integration tests (auth logic, Zod schemas, Drizzle queries).
2. Install Playwright for end-to-end tests covering: login/logout, checkout with both payment providers, and core content flows.
3. Add a CI step that runs both test suites on every pull request.

---

## Priority 7 — Observability

Tasks:
1. Add Sentry for error tracking on both client and server.
2. Enable Vercel Analytics (or confirm it's already on).
3. Ensure payment and auth errors are captured with enough context to debug without exposing sensitive data (no raw tokens, card numbers, or passwords in logs).

---

## Priority 8 — Finish the Supabase → Neon migration

Tasks:
1. Identify every remaining Supabase dependency (queries, storage calls, auth calls if any).
2. Migrate each to its Neon/Drizzle or R2 equivalent.
3. Remove the Supabase package and environment variables once nothing references it.

---

## Priority 9 — Update Next.js and dependencies

Tasks:
1. Upgrade to the latest stable Next.js 16.x release.
2. Run the official Next.js codemod for the upgrade.
3. Pay particular attention to any `middleware.js`/`proxy.js` authorization logic — recent Next.js security advisories specifically affected apps relying on middleware for authorization, so this must be re-tested after upgrading, especially once Better Auth is wired into middleware.

---

## Suggested implementation order
1. Zod validation (low risk, immediate security value, no architectural change)
2. Drizzle ORM (foundation for everything else)
3. Better Auth (the highest-value security fix)
4. Next.js/dependency upgrade + middleware re-test
5. Stripe addition
6. Testing + observability
7. Animation audit
8. Finish Supabase removal

Implement one priority at a time, confirm the app still builds and deploys after each, and don't start the next priority until the current one is verified working.