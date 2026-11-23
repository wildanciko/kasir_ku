"use client";

import { useState, useCallback, useEffect } from "react";
import { CATEGORIES, TAX_RATE, type CartItem, type Category } from "@/lib/data";
import { loadProducts, loadImages } from "@/lib/productStore";
import type { MenuItem } from "@/lib/data";
import { IconX, IconPlus } from "./icons";
import Toast from "./Toast";
import PaymentModal from "./PaymentModal";

export default function KasirPanel() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [images, setImages]       = useState<Record<number, string>>({});
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [toast, setToast]         = useState({ message: "", visible: false });
  const [showModal, setShowModal] = useState(false);
  const [txCount, setTxCount]     = useState(1);

  useEffect(() => {
    setMenuItems(loadProducts());
    setImages(loadImages());
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

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
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  const filtered = activeCategory === "All"
    ? menuItems
    : menuItems.filter((m) => m.category === activeCategory);

  return (
    <>
      <div className="flex flex-1 overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* ════ LEFT: Menu ════ */}
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 20px", borderRadius: 20, fontSize: 13, fontWeight: 500,
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

          {/* Menu grid — larger cards */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, alignContent: "start" }}
          >
            {filtered.map((item) => {
              const inCart = cart.find((c) => c.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item.id)}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "18px 12px 14px",
                    border: `2px solid ${inCart ? "var(--teal)" : "transparent"}`,
                    boxShadow: "var(--shadow)",
                    cursor: "pointer",
                    transition: "all .15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!inCart) e.currentTarget.style.borderColor = "var(--teal)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    if (!inCart) e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {inCart && (
                    <span
                      style={{
                        position: "absolute", top: 8, right: 8,
                        background: "var(--teal)", color: "#fff",
                        borderRadius: "50%", width: 20, height: 20,
                        fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {inCart.qty}
                    </span>
                  )}
                  {images[item.id] ? (
                    <img
                      src={images[item.id]}
                      alt={item.name}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }}
                    />
                  ) : (
                    <span style={{ fontSize: 42 }}>{item.emoji}</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: 13, fontWeight: 700, color: "var(--teal)",
                      background: "var(--teal-light)", borderRadius: 6, padding: "2px 10px",
                    }}
                  >
                    ${item.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ════ RIGHT: Cart / Order ════ */}
        <div
          className="flex flex-col flex-shrink-0 overflow-hidden"
          style={{
            width: 360,
            background: "#fff",
            borderLeft: "1px solid var(--border)",
          }}
        >
          {/* Cart header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Pesanan #{String(txCount).padStart(4, "0")}</h2>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  fontSize: 12, color: "var(--red)", background: "#FFF0F0",
                  border: "1px solid #FFD5D5", borderRadius: 8,
                  padding: "5px 12px", cursor: "pointer", fontWeight: 500,
                }}
              >
                Hapus Semua
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-full"
                style={{ color: "var(--muted)" }}
              >
                <span style={{ fontSize: 48, marginBottom: 12 }}>🛒</span>
                <p style={{ fontSize: 14, fontWeight: 500 }}>Cart kosong</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Pilih menu dari kiri</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        ${item.price.toFixed(2)} / pcs
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeQty(item.id, -1)}
                        style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: "var(--teal-light)", border: "none",
                          color: "var(--teal)", fontSize: 14, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >−</button>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 18, textAlign: "center" }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: "var(--teal-light)", border: "none",
                          color: "var(--teal)", fontSize: 14, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >+</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, minWidth: 46, textAlign: "right", color: "var(--teal)" }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        width: 24, height: 24, borderRadius: 5,
                        background: "#FFF0F0", border: "none", color: "var(--red)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <IconX size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary + Pay */}
          <div
            className="px-5 py-4 flex flex-col gap-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {/* Totals */}
            <div className="flex flex-col gap-1.5">
              {[
                ["Subtotal", `$${subtotal.toFixed(2)}`],
                ["Pajak (8%)", `$${tax.toFixed(2)}`],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between" style={{ fontSize: 13, color: "var(--muted)" }}>
                  <span>{lbl}</span><span>{val}</span>
                </div>
              ))}
              <div
                className="flex justify-between pt-2 mt-1"
                style={{
                  fontSize: 18, fontWeight: 700, color: "var(--text)",
                  borderTop: "1.5px dashed var(--border)",
                }}
              >
                <span>Total</span>
                <span style={{ color: "var(--teal)" }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer note */}
            <input
              type="text"
              placeholder="Catatan pesanan… (opsional)"
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1.5px solid var(--border)", fontSize: 12,
                outline: "none", color: "var(--text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />

            {/* Pay button */}
            <button
              onClick={() => {
                if (cart.length === 0) { showToast("Cart masih kosong!"); return; }
                setShowModal(true);
              }}
              style={{
                padding: "14px", borderRadius: 12, border: "none",
                background: cart.length > 0 ? "var(--teal)" : "#b0d9d6",
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: cart.length > 0 ? "pointer" : "not-allowed",
                transition: "background .15s",
              }}
            >
              💳 Bayar ${total.toFixed(2)}
            </button>
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
            setTxCount((n) => n + 1);
            showToast("✅ Transaksi berhasil disimpan!");
          }}
        />
      )}
    </>
  );
}
