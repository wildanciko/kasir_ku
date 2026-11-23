import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, TOKEN_COOKIE } from "@/lib/token";

export const runtime = "nodejs";

const BUCKET        = "product-images";
const MAX_BYTES     = 400_000;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase().from("products") as any;

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await props.params;
  const numId   = Number(id);
  if (!Number.isInteger(numId) || numId <= 0)
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!ALLOWED_TYPES.includes(contentType))
    return NextResponse.json({ error: "Hanya PNG, JPEG, WEBP, atau GIF." }, { status: 400 });

  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_BYTES)
    return NextResponse.json({ error: `Maksimal ${MAX_BYTES / 1000} KB.` }, { status: 413 });

  const ext  = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `products/${numId}.${ext}`;

  const { error: uploadErr } = await supabase().storage
    .from(BUCKET)
    .upload(path, buf, { contentType, upsert: true });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { error: dbErr } = await db().update({ image_path: path }).eq("id", numId);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  const { data: urlData } = supabase().storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await props.params;
  const numId   = Number(id);

  const { data } = await db().select("image_path").eq("id", numId).maybeSingle() as
    { data: { image_path: string | null } | null };

  if (data?.image_path) {
    await supabase().storage.from(BUCKET).remove([data.image_path]);
  }
  await db().update({ image_path: null }).eq("id", numId);
  return NextResponse.json({ ok: true });
}

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["Admin","Owner"].includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
