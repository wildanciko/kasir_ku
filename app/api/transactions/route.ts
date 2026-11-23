import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, TOKEN_COOKIE } from "@/lib/token";
import type { CartItem } from "@/lib/data";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase().from("transactions") as any;

export async function POST(req: NextRequest) {
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    cart: CartItem[]; subtotal: number; tax: number;
    total: number; paymentMethod: string; note?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { cart, paymentMethod, note } = body;

  if (
    !Array.isArray(cart) || cart.length === 0 ||
    !["Cash","Card","QRIS","Transfer"].includes(paymentMethod)
  ) {
    return NextResponse.json({ error: "Data transaksi tidak valid." }, { status: 400 });
  }

  // Server-side total calculation — ignore client-supplied numbers
  const items = cart.map((c) => ({
    id: c.id, name: c.name, price: c.price, qty: c.qty,
    subtotal: Math.round(c.price * c.qty * 100) / 100,
  }));
  const serverSubtotal = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
  const serverTax      = Math.round(serverSubtotal * 0.08 * 100) / 100;
  const serverTotal    = Math.round((serverSubtotal + serverTax) * 100) / 100;

  // Daily sequence number
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { count } = await db()
    .select("*", { count: "exact", head: true })
    .like("tx_number", `${today}-%`) as { count: number | null };
  const seq      = String((count ?? 0) + 1).padStart(4, "0");
  const txNumber = `${today}-${seq}`;

  const { data, error } = await db()
    .insert({
      tx_number:      txNumber,
      cashier_name:   payload.name,
      items,
      subtotal:       serverSubtotal,
      tax:            serverTax,
      total:          serverTotal,
      payment_method: paymentMethod,
      note:           note?.slice(0, 500) ?? null,
    })
    .select("id, tx_number, total")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["Admin","Owner"].includes(payload.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url    = new URL(req.url);
  const limit  = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const { data, error, count } = await db()
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1) as { data: unknown[]; error: { message: string } | null; count: number | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data, total: count }, { headers: { "Cache-Control": "no-store" } });
}
