"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, TAX_RATE, type CartItem, type Category } from "@/lib/data";
import { loadProducts, loadImages, sanitizeImageSrc } from "@/lib/productStore";
import type { MenuItem } from "@/lib/data";
import { IconX, IconPlus } from "@/components/icons";
import Toast from "@/components/Toast";
import PaymentModal from "@/components/PaymentModal";
import ReceiptModal from "@/components/ReceiptModal";

const CART_SESSION_KEY = "posymart_cart_admin";

export default function AdminOrderPanel() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [images, setImages]       = useState<Record<number, string>>({});
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [toast, setToast]         = useState({ message: "", visible: false });
  const [showModal, setShowModal] = useState(false);
  const [receipt, setReceipt]     = useState<{ payMethod: string } | null>(null);
  const [txCount, setTxCount]     = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setMenuItems(loadProducts());
    setImages(loadImages());
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CART_SESSION_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart)); }
    catch { /* ignore */ }
  }, [cart]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (cart.length > 0) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cart]);

  const showToast = useCallback((msg: string) => setToast({ message: msg, visible: true }), []);
  const hideToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  function addToCart(id: number) {
    const item = menuItems.find((m) => m.id === id)!;
    setCart((prev) => {
      const ex = prev.find((c) => c.id === id);
      if (ex) return prev.map((c) => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`${item.emoji} ${item.name} ditambahkan`);
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c).filter((c) => c.qty > 0)
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function clearCart() {
    setCart([]);
    showToast("Cart dikosongkan");
    sessionStorage.removeItem(CART_SESSION_KEY);
  }

  const subtotal  = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax       = subtotal * TAX_RATE;
  const total     = subtotal + tax;
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  const filtered = activeCategory === "All"
    ? menuItems
    : menuItems.filter((m) => m.category === activeCategory);

  return (
    <>
      <div className="flex flex-1 overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* ════ LEFT: Stat cards + Current Sale (dashboard style) ════ */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-5 pl-6">

          {/* Stat cards */}
          <AdminStatCards txCount={txCount} />

          {/* Current Sale */}
          <div
            className="flex flex-col rounded-2xl p-4 flex-1"
            style={{ background: "#fff", boxShadow: "var(--shadow)" }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>Current Sale</h2>
                <p style={{ fontSize: 11, color: "var(--muted)" }}>
                  Transaksi #{String(txCount).padStart(4, "0")} · {itemCount} item
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setConfirmClear(true)}
                  style={{
                    fontSize: 11, color: "var(--red)", background: "#FFF0F0",
                    border: "1px solid #FFD5D5", borderRadius: 6,
                    padding: "4px 10px", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Hapus Semua
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10" style={{ color: "var(--muted)", fontSize: 13 }}>
                  <span style={{ fontSize: 36, marginBottom: 8 }}>🛒</span>
                  Tambah item dari menu →
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-xl"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {images[item.id] ? (
                      <img src={sanitizeImageSrc(images[item.id]) ?? undefined} alt={item.name}
                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>${item.price.toFixed(2)}/pcs</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, border: "none",
                          background: "var(--teal-light)", color: "var(--teal)",
                          fontSize: 15, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >−</button>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6, border: "none",
                          background: "var(--teal-light)", color: "var(--teal)",
                          fontSize: 15, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, minWidth: 42, textAlign: "right" }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        width: 26, height: 26, borderRadius: 6, border: "none",
                        background: "#FFF0F0", color: "var(--red)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <IconX size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add note */}
            <button
              onClick={() => showToast("Catatan ditambahkan!")}
              className="flex items-center gap-2 mt-3"
              style={{ fontSize: 13, color: "var(--teal)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
            >
              <IconPlus size={14} /> Add Note
            </button>

            {/* Summary */}
            <div className="mt-3.5 pt-3.5" style={{ borderTop: "1px dashed var(--border)" }}>
              {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Tax (8%)", `$${tax.toFixed(2)}`]].map(([l, v]) => (
                <div key={l} className="flex justify-between mb-1.5" style={{ fontSize: 13, color: "var(--muted)" }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2.5" style={{ fontSize: 16, fontWeight: 700 }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={clearCart}
                style={{
                  flex: 1, padding: 12, borderRadius: 10,
                  background: "#fff", border: "1.5px solid var(--border)",
                  fontSize: 14, fontWeight: 600, color: "var(--muted)", cursor: "pointer",
                }}
              >
                Clear Cart
              </button>
              <button
                onClick={() => {
                  if (cart.length === 0) { showToast("Cart masih kosong!"); return; }
                  setShowModal(true);
                }}
                style={{
                  flex: 2, padding: 12, borderRadius: 10, border: "none",
                  background: "var(--teal)", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Pay ${total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>

        {/* ════ RIGHT: menu ════ */}
        <div
          className="overflow-y-auto flex flex-col gap-4 py-5 pr-6"
          style={{ width: 340, flexShrink: 0 }}
        >
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${activeCategory === cat ? "var(--teal)" : "var(--border)"}`,
                  background: activeCategory === cat ? "var(--teal)" : "#fff",
                  color: activeCategory === cat ? "#fff" : "var(--muted)",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item.id)}
                className="flex flex-col items-center gap-2 rounded-2xl p-3"
                style={{
                  background: "#fff", boxShadow: "var(--shadow)",
                  border: "1.5px solid transparent", cursor: "pointer",
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--teal)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {images[item.id] ? (
                  <img src={sanitizeImageSrc(images[item.id]) ?? undefined} alt={item.name}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10 }} />
                ) : (
                  <span style={{ fontSize: 36 }}>{item.emoji}</span>
                )}
                <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{item.name}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>${item.price.toFixed(2)}</span>
                <span
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: "var(--teal)", color: "#fff",
                    fontSize: 16, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >+</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {showModal && (
        <PaymentModal
          total={total}
          onClose={() => setShowModal(false)}
          onConfirm={(payMethod) => {
            setShowModal(false);
            setReceipt({ payMethod });
          }}
        />
      )}

      {receipt && (
        <ReceiptModal
          txNumber={String(txCount).padStart(4, "0")}
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          payMethod={receipt.payMethod}
          cashierName="Admin"
          onClose={() => {
            setReceipt(null);
            clearCart();
            setTxCount((n) => n + 1);
          }}
        />
      )}

      {/* Confirm clear */}
      {confirmClear && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 320, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Hapus Semua?</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Semua item akan dihapus dari cart.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1.5px solid var(--border)", background: "#fff", fontSize: 13, fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}>Batal</button>
              <button onClick={() => { clearCart(); setConfirmClear(false); }} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Stat cards for admin dashboard ──────────────────────────────────────────
import { IconDollar, IconDoc, IconUser, IconTrend } from "@/components/icons";

const STATS = [
  { label: "Total Sales",      value: "$4,892.45", delta: "▲ 12.5% from yesterday", up: true,  Icon: IconDollar },
  { label: "Orders",           value: "128",       delta: "▲ 8.2% from yesterday",  up: true,  Icon: IconDoc    },
  { label: "Customers",        value: "256",       delta: "▼ 3.4% from yesterday",  up: false, Icon: IconUser   },
  { label: "Avg. Order Value", value: "$38.22",    delta: "▲ 3.1% from yesterday",  up: true,  Icon: IconTrend  },
];

function AdminStatCards({ txCount }: { txCount: number }) {
  const displayStats = STATS.map((s, i) =>
    i === 1 ? { ...s, value: String(Number(s.value) + txCount - 1) } : s
  );
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {displayStats.map(({ label, value, delta, up, Icon }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "var(--shadow)" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
            <span
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: "var(--teal-light)", color: "var(--teal)" }}
            >
              <Icon size={16} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: up ? "var(--green)" : "var(--red)" }}>{delta}</div>
        </div>
      ))}
    </div>
  );
}
