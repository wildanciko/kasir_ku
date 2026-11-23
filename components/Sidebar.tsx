"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logoutRequest, type AuthUser } from "@/lib/auth";
// NOTE: this file is kept for compatibility — prefer admin/AdminSidebar or Point_of_sale/POSSidebar
import {
  IconDashboard, IconSales, IconProducts, IconCustomers,
  IconOrders, IconReports, IconDiscounts, IconUsers, IconSettings,
} from "./icons";

interface SidebarProps {
  user: AuthUser;
}

const NAV_ITEMS = [
  { label: "Dashboard", Icon: IconDashboard, href: "/"          },
  { label: "Kasir",     Icon: IconSales,     href: "/kasir"     },
  { label: "Products",  Icon: IconProducts,  href: "/products"  },
  { label: "Customers", Icon: IconCustomers, href: "#"          },
  { label: "Orders",    Icon: IconOrders,    href: "#"          },
  { label: "Reports",   Icon: IconReports,   href: "#"          },
  { label: "Discounts", Icon: IconDiscounts, href: "#"          },
  { label: "Users",     Icon: IconUsers,     href: "#"          },
  { label: "Settings",  Icon: IconSettings,  href: "#"          },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar({ user }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logoutRequest().then(() => router.replace("/login"));
  }

  return (
    <aside
      style={{ width: 210, borderRight: "1px solid var(--border)", background: "#fff", flexShrink: 0 }}
      className="flex flex-col h-full"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <rect width="30" height="30" rx="8" fill="#2BBFAD" />
          <path d="M8 10h14M8 15h10M8 20h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="20" r="3" fill="#fff" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--teal)" }}>PosyMart</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, Icon, href }) => {
          const isActive = href === "/"
            ? pathname === "/"
            : pathname.startsWith(href) && href !== "#";

          const inner = (
            <span
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5"
              style={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--teal)" : "var(--muted)",
                background: isActive ? "var(--teal-light)" : "transparent",
                display: "flex",
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>
                <Icon size={16} />
              </span>
              {label}
            </span>
          );

          if (href === "#") {
            return (
              <button
                key={label}
                className="w-full text-left"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link key={label} href={href} style={{ textDecoration: "none" }}>
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex items-center justify-center rounded-full text-white flex-shrink-0"
            style={{ width: 36, height: 36, background: "var(--teal)", fontSize: 12, fontWeight: 700 }}
          >
            {getInitials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{user.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl"
          style={{
            background: "#FFF0F0", border: "1px solid #FFD5D5",
            color: "var(--red)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "background .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF0F0"; e.currentTarget.style.color = "var(--red)"; }}
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
