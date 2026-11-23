"use client";

import { useState, useEffect } from "react";
import { useIdleTimeout } from "@/lib/useIdleTimeout";

export default function IdleWarning() {
  const [countdown, setCountdown] = useState<number | null>(null);

  useIdleTimeout({
    onWarning: (secondsLeft) => setCountdown(secondsLeft),
    onLogout:  () => setCountdown(null),
  });

  // Tick down every second while the warning is visible
  useEffect(() => {
    if (countdown == null || countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => (c != null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  if (countdown == null) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "#1A2B3C",
        color: "#fff",
        borderRadius: 12,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,.35)",
        minWidth: 340,
        maxWidth: "90vw",
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>⏱️</span>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Sesi hampir berakhir</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 2 }}>
          Tidak ada aktivitas. Logout otomatis dalam{" "}
          <strong style={{ color: countdown <= 10 ? "#FF5B5B" : "#2BBFAD" }}>
            {countdown}
          </strong>{" "}
          detik.
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0,
          height: 3,
          borderRadius: "0 0 12px 12px",
          background: countdown <= 10 ? "#FF5B5B" : "#2BBFAD",
          width: `${(countdown / 60) * 100}%`,
          transition: "width 1s linear, background .3s",
        }}
      />
    </div>
  );
}
