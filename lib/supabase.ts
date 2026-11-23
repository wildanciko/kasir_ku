/**
 * Supabase admin client — server-side only.
 * Uses the service role key which bypasses RLS.
 * NEVER import this in client components or expose the key to the browser.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

function createAdminClient(): AnyClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
      "Copy them from Supabase → Project Settings → API."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Module-level singleton — reused across requests in the same server process.
// On Vercel each serverless instance gets its own process, so this effectively
// caches one client per warm instance.
let _client: AnyClient | null = null;

export function supabase(): AnyClient {
  if (!_client) _client = createAdminClient();
  return _client;
}
