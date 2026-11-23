import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "@/lib/token";

export async function GET(req: NextRequest) {
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json(
      { user: null },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { user: { username: payload.username, name: payload.name, role: payload.role } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
