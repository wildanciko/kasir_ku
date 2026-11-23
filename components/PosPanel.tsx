"use client";

import { useState, useCallback, useEffect } from "react";
import { CATEGORIES, TAX_RATE, type CartItem, type Category } from "@/lib/data";
import { loadProducts, loadImages } from "@/lib/productStore";
import type { MenuItem } from "@/lib/data";
import { IconPlus, IconX, IconMoreH } from "./icons";
import Toast from "./Toast";
import PaymentModal from "./PaymentModal";

export default function PosPanel() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [images, setImages]       = useState<Record<number, string>>({});
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [toast, setToast]         = useState({ message: "", visible: false });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setMenuItems(loadProducts());
    setImages(loadImages());
  }, []);

  /* ── toast helper ── */
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  /* ── cart helpers ── */
  function addToCart(id: number) {
    const item = menuItems.find((m) => m.id === id)!;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`${item.emoji} ${item.name} ditambahkan`);
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0)
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function clearCart() {
    setCart([]);
    showToast("Cart dikosongkan");
  }

  /* ── totals ── */
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  /* ── filtered menu ── */
  const filtered = activeCategory === "All"
    ? menuItems
    : menuItems.filter((m) => m.category === activeCategory);

  return (
    <>
      {/* ════ TWO-COLUMN CONTENT ════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: stat cards + current sale ── */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-5 pl-6">

          {/* Stat cards (server-rendered via import — kept here for simplicity) */}
          <StatCards />

          {/* Current Sale */}
          <div
            className="flex flex-col rounded-2xl p-4 flex-1"
            style={{ background: "#fff", boxShadow: "var(--shadow)" }}
          >
            {/* header */}
            <div className="flex items-center justify-between mb-3.5">
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Current Sale</h2>
              <span style={{ color: "var(--muted)" }}><IconMoreH size={16} /></span>
            </div>

            {/* items */}
            <div className="flex flex-col gap-2.5">
              {cart.length === 0 ? (
                <div
                  className="text-center py-5"
                  style={{ color: "var(--muted)", fontSize: 13 }}
                >
                  Cart kosong. Tambah item dari menu →
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-xl"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>

                    {/* qty ctrl */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: "var(--teal-light)", border: "none",
                          color: "var(--teal)", fontSize: 15, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >−</button>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: "var(--teal-light)", border: "none",
                          color: "var(--teal)", fontSize: 15, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >+</button>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, minWidth: 42, textAlign: "right" }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: "#FFF0F0", border: "none", color: "var(--red)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <IconX size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* add note */}
            <button
              onClick={() => showToast("Catatan ditambahkan!")}
              className="flex items-center gap-2 mt-3"
              style={{ fontSize: 13, color: "var(--teal)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
            >
              <IconPlus size={14} /> Add Note
            </button>

            {/* summary */}
            <div
              className="mt-3.5 pt-3.5"
              style={{ borderTop: "1px dashed var(--border)" }}
            >
              {[
                ["Subtotal", `$${subtotal.toFixed(2)}`],
                ["Tax (8%)", `$${tax.toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between mb-1.5" style={{ fontSize: 13, color: "var(--muted)" }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div
                className="flex justify-between mt-2.5"
                style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}
              >
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* actions */}
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

        {/* ── RIGHT: menu ── */}
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
                  padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
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
                className="flex flex-col items-center gap-2 rounded-2xl p-3 text-left"
                style={{
                  background: "#fff", boxShadow: "var(--shadow)",
                  border: "1.5px solid transparent", cursor: "pointer",
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(43,191,173,.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                }}
              >
                {images[item.id] ? (
                  <img
                    src={images[item.id]}
                    alt={item.name}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10 }}
                  />
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
                >
                  +
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />

      {/* Payment modal */}
      {showModal && (
        <PaymentModal
          total={total}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            clearCart();
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────
   Inline StatCards
───────────────────────────────────── */
import { IconDollar, IconDoc, IconUser, IconTrend } from "./icons";

const STATS = [
  { label: "Total Sales",      value: "$4,892.45", delta: "▲ 12.5% from yesterday", up: true,  Icon: IconDollar },
  { label: "Orders",           value: "128",       delta: "▲ 8.2% from yesterday",  up: true,  Icon: IconDoc    },
  { label: "Customers",        value: "256",       delta: "▼ 3.4% from yesterday",  up: false, Icon: IconUser   },
  { label: "Avg. Order Value", value: "$38.22",    delta: "▲ 3.1% from yesterday",  up: true,  Icon: IconTrend  },
];

function StatCards() {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {STATS.map(({ label, value, delta, up, Icon }) => (
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
