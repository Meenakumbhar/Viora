import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// Mounts Better Auth's own internal routes (notably /api/auth/verify-email,
// which the link in the verification email points at). The app's own
// /api/auth/login, /signup, /logout, /me, /resend-verification routes take
// precedence over this catch-all for their exact paths — Next.js always
// prefers a literal route segment over a [...catchall] for the same path.
export const { GET, POST } = toNextJsHandler(auth);
