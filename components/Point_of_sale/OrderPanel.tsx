"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, TAX_RATE, type CartItem, type Category } from "@/lib/data";
import { loadProducts, loadImages, sanitizeImageSrc } from "@/lib/productStore";
import type { MenuItem } from "@/lib/data";
import { IconX } from "@/components/icons";
import Toast from "@/components/Toast";
import PaymentModal from "@/components/PaymentModal";
import ReceiptModal from "@/components/ReceiptModal";
import POSTopbar from "./POSTopbar";
import { type AuthUser } from "@/lib/auth";

const CART_SESSION_KEY = "posymart_cart_kasir";

interface OrderPanelProps {
  user: AuthUser;
}

export default function OrderPanel({ user }: OrderPanelProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [images, setImages]       = useState<Record<number, string>>({});
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [note, setNote]           = useState("");
  const [toast, setToast]         = useState({ message: "", visible: false });
  const [showModal, setShowModal] = useState(false);
  const [receipt, setReceipt]     = useState<{ payMethod: string } | null>(null);
  const [txCount, setTxCount]     = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load menu + images
  useEffect(() => {
    setMenuItems(loadProducts());
    setImages(loadImages());
  }, []);

  // Restore cart from sessionStorage (survives accidental refresh)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CART_SESSION_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Persist cart on every change
  useEffect(() => {
    try { sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(cart)); }
    catch { /* ignore quota errors */ }
  }, [cart]);

  // Warn before closing/refreshing with items in cart
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
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
    setNote("");
    sessionStorage.removeItem(CART_SESSION_KEY);
  }

  const subtotal  = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax       = subtotal * TAX_RATE;
  const total     = subtotal + tax;
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  const filtered = activeCategory === "All"
    ? menuItems
    : menuItems.filter((m) => m.category === activeCategory);

  const txNumber = String(txCount).padStart(4, "0");

  return (
    <>
      <POSTopbar user={user} txCount={txCount} />

      <div className="flex flex-1 overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* ════ LEFT: Menu ════ */}
        <div className="flex flex-col flex-1 overflow-hidden p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                  border: `1.5px solid ${activeCategory === cat ? "var(--teal)" : "var(--border)"}`,
                  background: activeCategory === cat ? "var(--teal)" : "#fff",
                  color: activeCategory === cat ? "#fff" : "var(--muted)",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {cat}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>
              {filtered.length} produk
            </span>
          </div>

          <div
            className="flex-1 overflow-y-auto"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, alignContent: "start" }}
          >
            {filtered.map((item) => {
              const inCart  = cart.find((c) => c.id === item.id);
              const imgSrc  = images[item.id] ? sanitizeImageSrc(images[item.id]) : null;
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item.id)}
                  style={{
                    background: "#fff", borderRadius: 14,
                    padding: "14px 10px 12px",
                    border: `2px solid ${inCart ? "var(--teal)" : "transparent"}`,
                    boxShadow: "var(--shadow)", cursor: "pointer",
                    transition: "all .15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { if (!inCart) e.currentTarget.style.borderColor = "#a8e8e2"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { if (!inCart) e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {inCart && (
                    <span style={{
                      position: "absolute", top: 7, right: 7,
                      background: "var(--teal)", color: "#fff",
                      borderRadius: "50%", width: 20, height: 20,
                      fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {inCart.qty}
                    </span>
                  )}
                  {imgSrc
                    ? <img src={imgSrc} alt={item.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }} />
                    : <span style={{ fontSize: 40 }}>{item.emoji}</span>
                  }
                  <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{item.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", background: "var(--teal-light)", borderRadius: 6, padding: "2px 10px" }}>
                    ${item.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                Tidak ada produk di kategori ini
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT: Cart ════ */}
        <div className="flex flex-col flex-shrink-0" style={{ width: 340, background: "#fff", borderLeft: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Daftar Pesanan</h2>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{itemCount} item · {cart.length} jenis</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                style={{ fontSize: 11, color: "var(--red)", background: "#FFF0F0", border: "1px solid #FFD5D5", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 500 }}
              >
                Hapus Semua
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--muted)" }}>
                <span style={{ fontSize: 48, marginBottom: 10 }}>🛒</span>
                <p style={{ fontSize: 14, fontWeight: 500 }}>Belum ada pesanan</p>
                <p style={{ fontSize: 12, marginTop: 3 }}>Ketuk menu di sebelah kiri</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {cart.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ border: "1px solid var(--border)", background: idx % 2 === 0 ? "#fff" : "var(--bg)" }}
                  >
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--teal-light)", color: "var(--teal)", fontSize: 10, fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }} className="truncate">{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>${item.price.toFixed(2)}/pcs</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => changeQty(item.id, -1)} style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "var(--teal-light)", color: "var(--teal)", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "var(--teal-light)", color: "var(--teal)", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", minWidth: 44, textAlign: "right" }}>${(item.price * item.qty).toFixed(2)}</div>
                    <button onClick={() => removeItem(item.id)} style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "#FFF0F0", color: "var(--red)", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconX size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: "var(--bg)" }}>
              {[["Subtotal", `$${subtotal.toFixed(2)}`], ["Pajak (8%)", `$${tax.toFixed(2)}`]].map(([l, v]) => (
                <div key={l} className="flex justify-between" style={{ fontSize: 12, color: "var(--muted)" }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1" style={{ fontSize: 17, fontWeight: 700, borderTop: "1.5px dashed var(--border)" }}>
                <span>Total</span>
                <span style={{ color: "var(--teal)" }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <input
              type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan pesanan… (opsional)"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 12, outline: "none", color: "var(--text)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />

            <button
              onClick={() => { if (cart.length === 0) { showToast("Belum ada pesanan!"); return; } setShowModal(true); }}
              style={{
                padding: "14px", borderRadius: 12, border: "none",
                background: cart.length > 0 ? "var(--teal)" : "#b0d9d6",
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: cart.length > 0 ? "pointer" : "not-allowed",
                boxShadow: cart.length > 0 ? "0 4px 16px rgba(43,191,173,.35)" : "none",
              }}
            >
              💳 Bayar ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm clear dialog */}
      {confirmClear && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🗑️</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Hapus Semua Pesanan?</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              {itemCount} item akan dihapus dari cart.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1.5px solid var(--border)", background: "#fff", fontSize: 13, fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}>Batal</button>
              <button onClick={() => { clearCart(); setConfirmClear(false); showToast("Pesanan dikosongkan"); }} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

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
          txNumber={txNumber}
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          total={total}
          payMethod={receipt.payMethod}
          cashierName={user.name}
          onClose={() => {
            setReceipt(null);
            clearCart();
            setTxCount((n) => n + 1);
          }}
        />
      )}
    </>
  );
}
