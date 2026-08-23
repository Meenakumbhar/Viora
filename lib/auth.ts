import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { NextResponse } from "next/server";
import { getDrizzle } from "@/db/client";
import { user, session, account, verification } from "@/db/auth-schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/resend";
import { SITE_URL } from "@/lib/site-url";

const db = getDrizzle();
if (!db) {
  throw new Error(
    "DATABASE_URL is required for authentication — better-auth stores users, sessions, and accounts in Postgres, not in the static-seed-data fallback the rest of lib/db.ts uses."
  );
}

export const auth = betterAuth({
  // BETTER_AUTH_URL is an optional explicit override; otherwise this uses
  // the same SITE_URL every other transactional email link in the app
  // already points to, so verification/reset links go to the deployed site
  // rather than silently falling back to localhost when unset.
  baseURL: process.env.BETTER_AUTH_URL ?? SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    // The login/signup routes already branch on an EMAIL_NOT_VERIFIED code
    // and an unverified-existing-user case, so this must stay true to match
    // what they assume.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ email: user.email, name: user.name, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ email: user.email, name: user.name, url });
    },
  },
  plugins: [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })],
});

// Better Auth's `asResponse: true` calls (signInEmail, signOut,
// changePassword, ...) return their own Response carrying the session
// Set-Cookie header(s). Route handlers build a different NextResponse for
// their own JSON body, so that cookie has to be copied across by hand or
// the browser never receives it. getSetCookie() (not .get(), which joins
// multiple cookies into one invalid comma-separated string) preserves each
// cookie separately.
export function forwardSetCookie(source: Response, target: NextResponse) {
  for (const cookie of source.headers.getSetCookie()) {
    target.headers.append("set-cookie", cookie);
  }
}
