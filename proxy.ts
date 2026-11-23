import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "@/lib/token";

// ── Route definitions ─────────────────────────────────────────────────────────

/** These paths are always public — no token needed */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",   // the only public API endpoint
  "/api/auth/logout",  // logout clears cookie, not sensitive
  "/api/auth/me",      // reads own cookie — harmless if called unauthed
];

/** Pages that only Admin or Owner can access (Kasir is blocked) */
const ADMIN_ONLY_PAGES = ["/", "/products"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isNextInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon")
  );
}

// ── Proxy function ────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass internal Next.js requests
  if (isNextInternal(pathname)) return NextResponse.next();

  // Strip any x-user-* headers the client tries to inject
  // (we set them ourselves below, so a client spoofing them must be blocked)
  const cleanHeaders = new Headers(request.headers);
  cleanHeaders.delete("x-user-name");
  cleanHeaders.delete("x-user-role");
  cleanHeaders.delete("x-user-username");

  const cleanRequest = NextResponse.next({
    request: { headers: cleanHeaders },
  });

  // Allow public paths unconditionally
  if (isPublic(pathname)) return cleanRequest;

  // All other API routes require a valid token
  const token   = request.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  // Not authenticated — redirect pages to /login, return 401 for API
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC: Kasir cannot access admin-only pages
  if (
    payload.role === "Kasir" &&
    ADMIN_ONLY_PAGES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
  ) {
    return NextResponse.redirect(new URL("/kasir", request.url));
  }

  // Authenticated — forward user identity as request headers for Server Components.
  // These are set server-side after stripping any client-supplied values above.
  const res = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(cleanHeaders.entries()),
        "x-user-name":     payload.name,
        "x-user-role":     payload.role,
        "x-user-username": payload.username,
      }),
    },
  });

  return res;
}

export const config = {
  matcher: [
    // Apply to every route except static assets
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
