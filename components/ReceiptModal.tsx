"use client";

import { type CartItem } from "@/lib/data";

interface ReceiptModalProps {
  txNumber: string;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  payMethod: string;
  cashierName: string;
  onClose: () => void;
}

export default function ReceiptModal({
  txNumber, cart, subtotal, tax, total, payMethod, cashierName, onClose,
}: ReceiptModalProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  function handlePrint() {
    window.print();
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 300, padding: 24,
      }}
    >
      <div
        className="receipt-printable"
        style={{
          background: "#fff", borderRadius: 16,
          width: 340, boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col items-center py-5 px-6"
          style={{ background: "var(--teal)", color: "#fff" }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ marginBottom: 6 }}>
            <rect width="30" height="30" rx="8" fill="rgba(255,255,255,.2)"/>
            <path d="M8 10h14M8 15h10M8 20h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="22" cy="20" r="3" fill="#fff"/>
          </svg>
          <div style={{ fontSize: 16, fontWeight: 700 }}>PosyMart</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
            {dateStr} · {timeStr}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
            Transaksi #{txNumber}
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-4">
          <div className="flex flex-col gap-2.5 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {item.qty} × ${item.price.toFixed(2)}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                  ${(item.price * item.qty).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div
            style={{ borderTop: "1px dashed var(--border)", paddingTop: 12 }}
            className="flex flex-col gap-1.5"
          >
            {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Pajak (8%)", `$${tax.toFixed(2)}`]].map(([l, v]) => (
              <div key={l} className="flex justify-between" style={{ fontSize: 12, color: "var(--muted)" }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div
              className="flex justify-between mt-1 pt-2"
              style={{ fontSize: 15, fontWeight: 700, borderTop: "1px solid var(--border)" }}
            >
              <span>TOTAL</span>
              <span style={{ color: "var(--teal)" }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div
            className="flex items-center justify-between mt-3 p-3 rounded-xl"
            style={{ background: "var(--teal-light)" }}
          >
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Metode Pembayaran</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--teal)" }}>{payMethod}</span>
          </div>

          {/* Footer */}
          <div className="text-center mt-4" style={{ fontSize: 11, color: "var(--muted)" }}>
            <div>Kasir: {cashierName}</div>
            <div style={{ marginTop: 4 }}>Terima kasih atas kunjungan Anda! 🙏</div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-2.5 px-5 pb-5"
          style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}
        >
          <button
            onClick={handlePrint}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: "var(--teal-light)", border: "none",
              color: "var(--teal)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            🖨️ Cetak
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: "var(--teal)", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Transaksi Baru
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(.receipt-printable) { display: none !important; }
          .receipt-printable {
            position: fixed; inset: 0;
            box-shadow: none; border-radius: 0;
            width: 100%; max-width: 320px; margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
