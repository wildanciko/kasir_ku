import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, TOKEN_COOKIE } from "@/lib/token";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase().from("products") as any;

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await props.params;
  const numId   = Number(id);
  if (!Number.isInteger(numId) || numId <= 0)
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.name     === "string" && body.name.trim())             updates.name     = body.name.trim().slice(0, 100);
  if (typeof body.price    === "number" && body.price > 0)               updates.price    = Math.round(body.price * 100) / 100;
  if (typeof body.emoji    === "string" && body.emoji)                   updates.emoji    = body.emoji.slice(0, 10);
  if (["Coffee","Food","Drinks","Desserts"].includes(body.category as string)) updates.category = body.category;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Tidak ada field yang diupdate." }, { status: 400 });

  const { data, error } = await db().update(updates).eq("id", numId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await props.params;
  const numId   = Number(id);
  if (!Number.isInteger(numId) || numId <= 0)
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const { error } = await db().update({ is_active: false }).eq("id", numId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["Admin","Owner"].includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
