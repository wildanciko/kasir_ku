import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, TOKEN_COOKIE } from "@/lib/token";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase().from("products") as any;

export async function GET() {
  const { data, error } = await db()
    .select("id, name, price, emoji, category, image_path")
    .eq("is_active", true)
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const authError = await requireRole(req, ["Admin", "Owner"]);
  if (authError) return authError;

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { name, price, emoji, category } = body;
  if (
    typeof name     !== "string" || !name.trim() || name.length > 100 ||
    typeof price    !== "number" || price <= 0   || price > 1_000_000 ||
    typeof emoji    !== "string" ||
    !["Coffee", "Food", "Drinks", "Desserts"].includes(category as string)
  ) {
    return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 });
  }

  const { data, error } = await db()
    .insert({
      name:     (name as string).trim().slice(0, 100),
      price:    Math.round((price as number) * 100) / 100,
      emoji:    (emoji as string).slice(0, 10) || "🛒",
      category,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}

async function requireRole(req: NextRequest, roles: string[]): Promise<NextResponse | null> {
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roles.includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
