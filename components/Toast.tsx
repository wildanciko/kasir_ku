"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, visible, onHide }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 2200);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "var(--teal)",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 4px 20px rgba(43,191,173,.4)",
        transform: visible ? "translateY(0)" : "translateY(80px)",
        opacity: visible ? 1 : 0,
        transition: "all .3s",
        zIndex: 999,
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}
