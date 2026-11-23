/**
 * HMAC-SHA256 signed session tokens for PosyMart.
 *
 * Format:  base64url(header).base64url(payload).base64url(signature)
 *
 * Security requirements:
 *  - POSYMART_SECRET env var MUST be set, minimum 32 characters.
 *  - Tokens are stored in HttpOnly, SameSite=Strict cookies — never localStorage.
 *  - Every token carries a unique `jti`; logout revokes it server-side via sessionStore.
 *  - verifyToken checks signature → alg → payload types → expiry → revocation.
 */

import { registerSession, isRevoked } from "./sessionStore";
// sessionStore methods are now async (Supabase-backed)

export const TOKEN_COOKIE = "posymart_token";
export const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ── Secret ────────────────────────────────────────────────────────────────────

function getSecret(): string {
  const s = process.env.POSYMART_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "POSYMART_SECRET is not set or is shorter than 32 characters. " +
      "Set it in .env.local for development or in your hosting environment for production."
    );
  }
  return s;
}

// ── Base64url ─────────────────────────────────────────────────────────────────

function b64urlEncode(input: ArrayBuffer | Uint8Array): string {
  const buf = input instanceof Uint8Array ? input : new Uint8Array(input);
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad    = (4 - (padded.length % 4)) % 4;
  return Uint8Array.from(atob(padded + "=".repeat(pad)), (c) => c.charCodeAt(0));
}

// ── HMAC ──────────────────────────────────────────────────────────────────────

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(data: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await getKey(), new TextEncoder().encode(data));
  return b64urlEncode(sig);
}

async function hmacVerify(data: string, sig: string): Promise<boolean> {
  const sigBuf = b64urlDecode(sig);
  return crypto.subtle.verify(
    "HMAC", await getKey(),
    sigBuf.buffer as ArrayBuffer,
    new TextEncoder().encode(data)
  );
}

// ── Unique token ID ───────────────────────────────────────────────────────────

function generateJti(): string {
  // 128 bits of randomness, base64url encoded
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface TokenPayload {
  jti:      string;  // unique token ID — used for revocation
  username: string;
  name:     string;
  role:     string;
  iat:      number;  // issued-at ms
  exp:      number;  // expires-at ms
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createToken(
  payload: Omit<TokenPayload, "jti" | "iat" | "exp">
): Promise<string> {
  const now = Date.now();
  const full: TokenPayload = {
    jti: generateJti(),
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };

  const header  = b64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body    = b64urlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const content = `${header}.${body}`;
  const token   = `${content}.${await hmacSign(content)}`;

  // Register in the session store so logout can revoke it
  await registerSession(full.jti, full.exp);

  return token;
}

// ── Verify ────────────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [rawHeader, rawBody, sig] = parts;

    // 1. Signature (constant-time via WebCrypto HMAC verify)
    if (!await hmacVerify(`${rawHeader}.${rawBody}`, sig)) return null;

    // 2. Algorithm header must be HS256
    const header = JSON.parse(
      new TextDecoder().decode(b64urlDecode(rawHeader))
    ) as Record<string, unknown>;
    if (header.alg !== "HS256") return null;

    // 3. Payload structure
    const p = JSON.parse(
      new TextDecoder().decode(b64urlDecode(rawBody))
    ) as Record<string, unknown>;

    if (
      typeof p.jti      !== "string" || !p.jti ||
      typeof p.username !== "string" || !p.username ||
      typeof p.name     !== "string" || !p.name ||
      typeof p.role     !== "string" || !p.role ||
      typeof p.iat      !== "number" ||
      typeof p.exp      !== "number" || !Number.isFinite(p.exp)
    ) return null;

    // 4. Expiry
    if (Date.now() > (p.exp as number)) return null;

    // 5. Revocation check (Supabase denylist)
    if (await isRevoked(p.jti as string)) return null;

    return p as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/** Extract the jti from a token without full verification. Used only for logout. */
export function extractJti(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const p = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))) as Record<string, unknown>;
    return typeof p.jti === "string" ? p.jti : null;
  } catch {
    return null;
  }
}
