"use client";

import { useState } from "react";

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (payMethod: string) => void;
}

const METHODS = [
  { id: "Cash",     label: "Cash",     icon: "💵" },
  { id: "Card",     label: "Card",     icon: "💳" },
  { id: "QRIS",     label: "QRIS",     icon: "📱" },
  { id: "Transfer", label: "Transfer", icon: "🏦" },
];

export default function PaymentModal({ total, onClose, onConfirm }: PaymentModalProps) {
  const [selected, setSelected] = useState("Cash");

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Pilih Metode Pembayaran</h2>

        <div style={{ fontSize: 28, fontWeight: 700, textAlign: "center", color: "var(--teal)", marginBottom: 18 }}>
          ${total.toFixed(2)}
        </div>

        <div className="grid grid-cols-2 gap-2.5" style={{ marginBottom: 18 }}>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              style={{
                padding: 12, borderRadius: 10, textAlign: "center",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: `1.5px solid ${selected === m.id ? "var(--teal)" : "var(--border)"}`,
                background: selected === m.id ? "var(--teal-light)" : "#fff",
                color: selected === m.id ? "var(--teal)" : "var(--text)",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12, borderRadius: 10,
              border: "1.5px solid var(--border)", background: "#fff",
              fontSize: 14, fontWeight: 600, color: "var(--muted)", cursor: "pointer",
            }}
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(selected)}
            style={{
              flex: 2, padding: 12, borderRadius: 10, border: "none",
              background: "var(--teal)", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}
