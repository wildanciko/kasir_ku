import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE, extractJti, verifyToken } from "@/lib/token";
import { revokeSession } from "@/lib/sessionStore";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  if (token) {
    // We need the exp to store in the denylist (for auto-cleanup)
    const jti = extractJti(token);
    // We skip full verification here — if someone has a valid cookie they should
    // be able to log out even if the token is about to expire.
    // We do a quick decode to get exp (no sig check needed for logout path).
    if (jti) {
      // Get exp from token without full verification
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(
              parts[1].replace(/-/g, "+").replace(/_/g, "/"),
              "base64"
            ).toString()
          ) as Record<string, unknown>;
          const exp = typeof payload.exp === "number" ? payload.exp : Date.now() + 8 * 3600 * 1000;
          await revokeSession(jti, exp);
        }
      } catch {
        // Best-effort — if decode fails, still clear the cookie
      }
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name:     TOKEN_COOKIE,
    value:    "",
    httpOnly: true,
    sameSite: "strict",
    path:     "/",
    maxAge:   0,
    secure:   process.env.NODE_ENV === "production",
  });

  return res;
}
