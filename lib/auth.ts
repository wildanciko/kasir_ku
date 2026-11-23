/**
 * Client-side auth helpers.
 * NO credentials here — all authentication happens server-side via
 * /api/auth/login which sets an HttpOnly cookie.
 */

export interface AuthUser {
  username: string;
  name: string;
  role: string;
}

/** Call the login API. Returns the user on success, throws on failure. */
export async function loginRequest(
  username: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login gagal.");
  return data.user as AuthUser;
}

/** Call the logout API. Clears the HttpOnly cookie server-side. */
export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/** Fetch current user from the token cookie (server verifies). */
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}
