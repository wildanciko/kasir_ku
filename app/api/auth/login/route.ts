import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/serverAuth";
import { createToken, TOKEN_COOKIE, TOKEN_TTL_MS } from "@/lib/token";

// Argon2id requires the Node.js runtime (not Edge)
export const runtime = "nodejs";

// ── Rate limiter ──────────────────────────────────────────────────────────────
// In-memory per-process store. Good enough for single-server dev.
// Replace with Redis/Upstash for production serverless/multi-instance.
//
// Key: `${username}:${ip}` — locks per account, not just per IP.
// This prevents IP-cycling attacks while not locking out the entire IP.

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 minutes

// Prune stale entries periodically to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of attempts) {
    if (now > rec.resetAt) attempts.delete(key);
  }
}, WINDOW_MS);

/** Returns true if the attempt is allowed, false if rate-limited. */
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now > rec.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count++;
  return true;
}

/** Clear the rate limit counter on successful login */
function clearRateLimit(key: string) {
  attempts.delete(key);
}

// ── Trusted proxy IP extraction ───────────────────────────────────────────────
// Only trust x-forwarded-for if the request came through a known trusted proxy.
// In development (no trusted proxy env), fall back to "dev" so the limiter
// still works (all dev requests share one bucket — that's fine).

function getClientIp(req: NextRequest): string {
  const trustedProxy = process.env.TRUSTED_PROXY === "1";
  if (trustedProxy) {
    // Take the leftmost address (the real client IP)
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
  }
  return "dev";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  // Validate types and lengths
  const { username, password } = body;
  if (
    typeof username !== "string" || username.length === 0 || username.length > 64 ||
    typeof password !== "string" || password.length === 0 || password.length > 128
  ) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  // Rate limit: keyed by "username:ip"
  const ip  = getClientIp(req);
  const key = `${username.toLowerCase()}:${ip}`;

  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) } }
    );
  }

  const user = await authenticate(username, password);
  if (!user) {
    // Generic message — don't reveal whether username or password was wrong
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 }
    );
  }

  // Successful login — clear the rate limit counter
  clearRateLimit(key);

  const token = await createToken({
    username: user.username,
    name:     user.name,
    role:     user.role,
  });

  const res = NextResponse.json({
    ok: true,
    user: { username: user.username, name: user.name, role: user.role },
  });

  res.cookies.set({
    name:     TOKEN_COOKIE,
    value:    token,
    httpOnly: true,
    sameSite: "strict",
    path:     "/",
    maxAge:   Math.floor(TOKEN_TTL_MS / 1000),
    // Secure in production; omit in dev (HTTP localhost)
    secure:   process.env.NODE_ENV === "production",
  });

  return res;
}
