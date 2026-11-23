/**
 * Server-side authentication — users stored in Supabase.
 * Never import from client components or Edge runtime code.
 */

import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { supabase } from "./supabase";

export interface UserRecord {
  id:           string;
  username:     string;
  passwordHash: string;
  name:         string;
  role:         "Admin" | "Kasir" | "Owner";
}

// Argon2id — OWASP minimum (2 = Algorithm.Argon2id numeric value)
const ARGON2_OPTIONS = {
  algorithm:   2 as number,
  memoryCost:  19456,
  timeCost:    2,
  parallelism: 1,
};

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$dummysaltdummysaltdummysalt123456$dummyhashvaluedummyhashvaluedummyhashvaluedummy";

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, ARGON2_OPTIONS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify(hash, password);
  } catch {
    return false;
  }
}

interface DBUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: string;
  is_active: boolean;
}

export async function authenticate(
  username: string,
  password: string
): Promise<UserRecord | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase().from("users") as any)
    .select("id, username, password_hash, name, role, is_active")
    .eq("username", username)
    .maybeSingle() as { data: DBUser | null; error: { message: string } | null };

  if (error) console.error("[serverAuth] DB error:", error.message);

  const hashToCheck = data?.password_hash ?? DUMMY_HASH;
  const passwordOk  = await verifyPassword(password, hashToCheck);

  if (!data || !passwordOk || !data.is_active) return null;

  return {
    id:           data.id,
    username:     data.username,
    passwordHash: data.password_hash,
    name:         data.name,
    role:         data.role as UserRecord["role"],
  };
}
