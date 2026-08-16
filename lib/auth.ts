import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDrizzle } from '@/db/client';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/resend';

function requireDb() {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  return db;
}

// Better Auth's server API returns a real Response when called with
// `asResponse: true` — this copies its Set-Cookie header(s) onto our own
// NextResponse so the session cookie actually reaches the browser, since we
// call auth.api.* from our own route handlers rather than exposing Better
// Auth's routes directly for login/signup/logout.
export function forwardSetCookie(from: Response, to: { headers: Headers }) {
  for (const cookie of from.headers.getSetCookie()) {
    to.headers.append('set-cookie', cookie);
  }
}

export const auth = betterAuth({
  baseURL: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL : 'http://localhost:3000',
  secret: process.env.SESSION_SECRET,
  database: drizzleAdapter(requireDb(), { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    // A successful reset invalidates every other active session — the same
    // security posture as "log out everywhere" after a credential change.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ email: user.email, name: user.name, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ email: user.email, name: user.name, url });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
        defaultValue: 'user',
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      country: {
        type: 'string',
        required: false,
        input: true,
      },
      address: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days, matches the previous custom session TTL
  },
});
