import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Service-role client — bypasses RLS.
 * Use ONLY in server-side API routes, never expose to the browser.
 */
export const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — cannot create admin client.');
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

/**
 * Public client — respects RLS.
 * Safe for server components and public API reads (portfolio, posts).
 */
export const createPublicClient = () => {
  return createSupabaseClient(supabaseUrl, publishableKey);
};
