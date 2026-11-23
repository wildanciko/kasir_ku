"use client";

import { useState } from "react";
import { type AuthUser } from "@/lib/auth";
import { IconSearch, IconBell, IconCart } from "./icons";

interface TopbarProps {
  user: AuthUser;
  title?: string;
  subtitle?: string;
}

export default function Topbar({ user, title, subtitle }: TopbarProps) {
  const [query, setQuery] = useState("");

  const greeting = title ?? `Welcome back, ${user.name.split(" ")[0]}! 👋`;
  const sub = subtitle ?? "Here's what's happening with your store today.";

  return (
    <header
      className="flex items-center gap-4 px-6 py-3.5 flex-shrink-0"
      style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}
    >
      {/* Title */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>{greeting}</h1>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{sub}</p>
      </div>

      {/* Search */}
      <div
        className="ml-auto flex items-center gap-2 px-3.5 py-2 rounded-xl"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", minWidth: 220 }}
      >
        <span style={{ color: "var(--muted)" }}>
          <IconSearch size={14} />
        </span>
        <input
          type="text"
          placeholder="Search anything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: "none", background: "transparent", outline: "none",
            fontSize: 13, color: "var(--text)", flex: 1,
          }}
        />
        <span style={{ fontSize: 11, color: "var(--muted)" }}>⌘K</span>
      </div>

      {/* Icons */}
      <div className="flex gap-2.5">
        {[IconBell, IconCart].map((Icon, i) => (
          <button
            key={i}
            className="relative flex items-center justify-center rounded-xl transition-colors duration-150"
            style={{
              width: 36, height: 36,
              background: "var(--bg)", border: "1px solid var(--border)",
              cursor: "pointer", color: "var(--muted)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--teal-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg)")}
          >
            <Icon size={16} />
            <span
              className="absolute rounded-full"
              style={{
                top: 5, right: 5, width: 8, height: 8,
                background: "var(--red)", border: "1.5px solid #fff",
              }}
            />
          </button>
        ))}
      </div>
    </header>
  );
}
