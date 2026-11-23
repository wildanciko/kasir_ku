"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginRequest } from "@/lib/auth";
import { Suspense } from "react";

function LoginFormInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Username dan password harus diisi.");
      return;
    }
    setLoading(true);
    try {
      const user = await loginRequest(username, password);
      // Validate "from" param — only allow same-origin relative paths
      const rawFrom  = searchParams.get("from");
      const safeFrom = sanitizeRedirectTarget(rawFrom);
      if (safeFrom && safeFrom !== "/login") {
        router.replace(safeFrom);
      } else if (user.role === "Kasir") {
        router.replace("/kasir");
      } else {
        router.replace("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal.");
      setLoading(false);
    }
  }

  /** Only allow paths that belong to this origin. Blocks https://evil.com, //evil.com, javascript: */
  function sanitizeRedirectTarget(raw: string | null): string | null {
    if (!raw) return null;
    try {
      // new URL(raw, base) will throw if raw is an absolute URL to a different origin
      const url = new URL(raw, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      // Strip any path traversal and return only path+search+hash
      return url.pathname + url.search + url.hash;
    } catch {
      return null;
    }
  }

  const fieldStyle = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", padding: "11px 14px",
    borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${hasErr ? "var(--red)" : "var(--border)"}`,
    outline: "none", color: "var(--text)", transition: "border-color .15s",
  });

  return (
    <div
      className="flex min-h-full items-center justify-center"
      style={{ background: "linear-gradient(135deg, #E6F9F7 0%, #F4F7F9 50%, #dff4f1 100%)" }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20,
          padding: "40px 36px", width: 420,
          boxShadow: "0 8px 40px rgba(43,191,173,.15)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <svg width="38" height="38" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="#2BBFAD"/>
              <path d="M8 10h14M8 15h10M8 20h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="22" cy="20" r="3" fill="#fff"/>
            </svg>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#2BBFAD" }}>PosyMart</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Modern Cafe &amp; Restaurant POS</p>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Selamat Datang 👋</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
          Masuk ke akun Anda untuk melanjutkan
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div>
            <label htmlFor="username" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Username
            </label>
            <input
              id="username" type="text" autoComplete="username"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={fieldStyle(!!error)}
              onFocus={(e) => !error && (e.target.style.borderColor = "var(--teal)")}
              onBlur={(e)  => !error && (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password" type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...fieldStyle(!!error), paddingRight: 44 }}
                onFocus={(e) => !error && (e.target.style.borderColor = "var(--teal)")}
                onBlur={(e)  => !error && (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="button" onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--muted)", fontSize: 14,
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 13, color: "var(--red)",
              background: "#FFF0F0", border: "1px solid #FFD5D5",
              borderRadius: 8, padding: "9px 12px",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: 12, borderRadius: 10, border: "none",
              background: loading ? "#a8e8e2" : "var(--teal)",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background .15s", marginTop: 4,
            }}
          >
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>

        {/* Demo hint — no passwords shown */}
        <div style={{
          marginTop: 24, padding: "14px 16px",
          background: "var(--teal-light)", borderRadius: 10,
          fontSize: 12, color: "var(--muted)",
        }}>
          <div style={{ fontWeight: 600, color: "var(--teal)", marginBottom: 4 }}>
            🔑 Akun Demo
          </div>
          <p>Hubungi administrator Anda untuk mendapatkan username dan password.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
