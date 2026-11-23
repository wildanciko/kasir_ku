"use client";

import { type AuthUser } from "@/lib/auth";

interface POSTopbarProps {
  user: AuthUser;
  txCount: number;
}

export default function POSTopbar({ user, txCount }: POSTopbarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <header
      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}
    >
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>
          Transaksi #{String(txCount).padStart(4, "0")}
        </h1>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
          {dateStr} · {timeStr}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Kasir badge */}
        <div
          style={{
            background: "var(--teal-light)", borderRadius: 10,
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>👤</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--teal)" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>Kasir bertugas</div>
          </div>
        </div>
      </div>
    </header>
  );
}
