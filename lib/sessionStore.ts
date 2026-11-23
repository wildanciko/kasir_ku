/**
 * Session denylist backed by Supabase (revoked_sessions table).
 *
 * Survives server restarts and works across all Vercel serverless instances.
 * Falls back gracefully if Supabase is unreachable (token is then treated as
 * valid — better than a full outage locking everyone out).
 */
import { supabase } from "./supabase";

export async function registerSession(
  _jti: string,
  _exp: number
): Promise<void> {
  // No-op: we only write on revocation, not on creation.
  // Active sessions are tracked implicitly by token signature + expiry.
}

export async function revokeSession(jti: string, exp: number): Promise<void> {
  try {
    const sb = supabase();
    await sb
      .from("revoked_sessions")
      .upsert(
        { jti, expires_at: new Date(exp).toISOString() },
        { onConflict: "jti" }
      );
  } catch (err) {
    console.error("[sessionStore] revokeSession failed:", err);
  }
}

export async function isRevoked(jti: string): Promise<boolean> {
  try {
    const sb = supabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("revoked_sessions") as any)
      .select("jti")
      .eq("jti", jti)
      .maybeSingle();

    if (error) {
      console.error("[sessionStore] isRevoked query failed:", (error as { message: string }).message);
      return false;
    }
    return data !== null;
  } catch {
    return false;
  }
}
