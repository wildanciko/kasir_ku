"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutRequest, type AuthUser } from "@/lib/auth";

interface POSSidebarProps {
  user: AuthUser;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const NAV = [
  {
    href: "/kasir",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    label: "Kasir",
  },
];

export default function POSSidebar({ user }: POSSidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: 200, background: "#1A2B3C", flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <rect width="30" height="30" rx="8" fill="#2BBFAD" />
          <path d="M8 10h14M8 15h10M8 20h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="20" r="3" fill="#fff" />
        </svg>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>PosyMart</div>
          <div
            style={{
              fontSize: 10, fontWeight: 600, color: "#2BBFAD",
              background: "rgba(43,191,173,.15)", borderRadius: 4,
              padding: "1px 6px", display: "inline-block", marginTop: 2,
            }}
          >
            KASIR
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: "none" }}
            >
              <span
                className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
                style={{
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  color: active ? "#fff" : "rgba(255,255,255,.5)",
                  background: active ? "rgba(43,191,173,.2)" : "transparent",
                  display: "flex",
                  borderLeft: active ? "3px solid #2BBFAD" : "3px solid transparent",
                }}
              >
                <span style={{ color: active ? "#2BBFAD" : "rgba(255,255,255,.4)" }}>{icon}</span>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "12px 4px" }} />

        {/* Info box */}
        <div
          style={{
            background: "rgba(43,191,173,.1)", borderRadius: 10,
            padding: "12px", border: "1px solid rgba(43,191,173,.2)",
          }}
        >
          <div style={{ fontSize: 11, color: "#2BBFAD", fontWeight: 600, marginBottom: 4 }}>
            Mode Kasir
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
            Anda hanya dapat melayani transaksi. Hubungi Admin untuk mengubah produk.
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex items-center justify-center rounded-full text-white flex-shrink-0"
            style={{ width: 36, height: 36, background: "#2BBFAD", fontSize: 12, fontWeight: 700 }}
          >
            {getInitials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }} className="truncate">
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{user.role}</div>
          </div>
        </div>
        <button
          onClick={() => { logoutRequest().then(() => router.replace("/login")); }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl"
          style={{
            background: "rgba(255,91,91,.15)", border: "1px solid rgba(255,91,91,.3)",
            color: "#FF5B5B", fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "background .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#FF5B5B"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,91,91,.15)"; e.currentTarget.style.color = "#FF5B5B"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
