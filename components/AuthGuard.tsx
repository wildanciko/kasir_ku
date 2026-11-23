"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type AuthUser } from "@/lib/auth";

interface AuthGuardProps {
  children: (user: AuthUser) => React.ReactNode;
  /** Roles allowed to view this page. Omit to allow any authenticated user. */
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router  = useRouter();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchMe().then((u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      if (allowedRoles && !allowedRoles.includes(u.role)) {
        // Wrong role — redirect to their home
        router.replace(u.role === "Kasir" ? "/kasir" : "/");
        return;
      }
      setUser(u);
      setChecking(false);
    });
  }, [router, allowedRoles]);

  if (checking) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <svg
            style={{ color: "var(--teal)", animation: "spin 1s linear infinite" }}
            width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Memverifikasi sesi…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children(user)}</>;
}
