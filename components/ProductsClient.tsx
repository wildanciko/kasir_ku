"use client";

import { useState, useEffect, useRef } from "react";
import AuthGuard from "./AuthGuard";
import AdminSidebar from "./admin/AdminSidebar";
import Topbar from "./Topbar";
import Toast from "./Toast";
import {
  loadProducts, saveProducts, resetProducts, nextId,
  loadImages, saveImage, deleteImage, validateImageFile,
} from "@/lib/productStore";
import { CATEGORIES, type MenuItem, type Category } from "@/lib/data";
import { IconX, IconPlus } from "./icons";

// Categories without "All" for the form select
const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c !== "All") as Exclude<Category, "All">[];

const EMOJI_SUGGESTIONS = [
  "☕","🥛","🍵","🧃","🥤","🍹","🍺","🧊",
  "🥐","🥯","🥖","🧇","🥞","🧆","🥚","🍳",
  "🥗","🥙","🌮","🌯","🥪","🍔","🍟","🌭",
  "🍕","🍝","🍜","🍲","🍛","🍣","🍱","🍤",
  "🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍪",
  "🍊","🍋","🍎","🍓","🍇","🍉","🍑","🥝",
];

interface FormState {
  name: string;
  price: string;
  category: Exclude<Category, "All">;
  emoji: string;
  imageFile: File | null;
  imagePreview: string; // data-url or empty
}

const EMPTY_FORM: FormState = {
  name: "", price: "", category: "Coffee", emoji: "☕",
  imageFile: null, imagePreview: "",
};

export default function ProductsClient() {
  return (
    <AuthGuard>
      {(user) => (
        <div className="flex h-full overflow-hidden">
          <AdminSidebar user={user} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Topbar
              user={user}
              title="Manajemen Produk 📦"
              subtitle="Tambah, edit, dan hapus produk menu."
            />
            <ProductsPanel />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

export function ProductsPanel() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [images, setImages]     = useState<Record<number, string>>({});
  const [filterCat, setFilterCat] = useState<Category>("All");
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast]       = useState({ message: "", visible: false });
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setProducts(loadProducts());
    setImages(loadImages());
  }, []);

  function showToast(msg: string) {
    setToast({ message: msg, visible: true });
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchCat  = filterCat === "All" || p.category === filterCat;
    const matchText = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  // ── Form helpers ──────────────────────────────────────────────────────────
  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category as Exclude<Category, "All">,
      emoji: item.emoji,
      imageFile: null,
      imagePreview: images[item.id] ?? "",
    });
    setShowForm(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      showToast(`⚠️ ${validation.error}`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({
        ...f,
        imageFile: file,
        imagePreview: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const name  = form.name.trim();
    const price = parseFloat(form.price);
    if (!name)        { showToast("⚠️ Nama produk wajib diisi"); return; }
    if (isNaN(price) || price <= 0) { showToast("⚠️ Harga harus angka positif"); return; }

    let updated: MenuItem[];

    if (editItem) {
      // Update existing
      updated = products.map((p) =>
        p.id === editItem.id
          ? { ...p, name, price, category: form.category, emoji: form.emoji }
          : p
      );
      if (form.imagePreview) {
        saveImage(editItem.id, form.imagePreview);
        setImages((prev) => ({ ...prev, [editItem.id]: form.imagePreview }));
      } else if (!form.imagePreview && images[editItem.id]) {
        deleteImage(editItem.id);
        setImages((prev) => { const n = { ...prev }; delete n[editItem.id]; return n; });
      }
      showToast(`✅ "${name}" berhasil diperbarui`);
    } else {
      // Create new
      const id = nextId();
      const newItem: MenuItem = { id, name, price, category: form.category, emoji: form.emoji };
      updated = [...products, newItem];
      if (form.imagePreview) {
        saveImage(id, form.imagePreview);
        setImages((prev) => ({ ...prev, [id]: form.imagePreview }));
      }
      showToast(`✅ "${name}" berhasil ditambahkan`);
    }

    saveProducts(updated);
    setProducts(updated);
    setShowForm(false);
  }

  function handleDelete(id: number) {
    const updated = products.filter((p) => p.id !== id);
    deleteImage(id);
    setImages((prev) => { const n = { ...prev }; delete n[id]; return n; });
    saveProducts(updated);
    setProducts(updated);
    setDeleteConfirm(null);
    showToast("🗑️ Produk dihapus");
  }

  function handleReset() {
    resetProducts();
    // also clear images for default items only
    localStorage.removeItem("posymart_images");
    setProducts(loadProducts());
    setImages({});
    showToast("🔄 Produk direset ke default");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "var(--bg)" }}>

        {/* ── Toolbar ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}
        >
          {/* Search */}
          <input
            type="text"
            placeholder="Cari produk…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "9px 14px", borderRadius: 10, fontSize: 13,
              border: "1.5px solid var(--border)", outline: "none",
              color: "var(--text)", width: 220,
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />

          {/* Category filter */}
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${filterCat === cat ? "var(--teal)" : "var(--border)"}`,
                  background: filterCat === cat ? "var(--teal)" : "#fff",
                  color: filterCat === cat ? "#fff" : "var(--muted)",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleReset}
              style={{
                padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                border: "1.5px solid var(--border)", background: "#fff",
                color: "var(--muted)", cursor: "pointer",
              }}
            >
              Reset Default
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2"
              style={{
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: "none", background: "var(--teal)", color: "#fff", cursor: "pointer",
              }}
            >
              <IconPlus size={14} /> Tambah Produk
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div
          className="flex gap-6 px-6 py-3 flex-shrink-0"
          style={{ background: "var(--teal-light)", borderBottom: "1px solid var(--border)" }}
        >
          <span style={{ fontSize: 13, color: "var(--teal)", fontWeight: 600 }}>
            Total Produk: {products.length}
          </span>
          {PRODUCT_CATEGORIES.map((cat) => (
            <span key={cat} style={{ fontSize: 13, color: "var(--muted)" }}>
              {cat}: {products.filter((p) => p.category === cat).length}
            </span>
          ))}
        </div>

        {/* ── Product Grid ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--muted)" }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>📦</span>
              <p style={{ fontSize: 15, fontWeight: 500 }}>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {filtered.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  image={images[item.id]}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeleteConfirm(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <ModalOverlay onClose={() => setShowForm(false)}>
          <div style={{ width: 500 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>
                {editItem ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <IconX size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Image upload */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Gambar Produk
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div
                    style={{
                      width: 80, height: 80, borderRadius: 12,
                      border: "2px dashed var(--border)",
                      background: "var(--bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", flexShrink: 0,
                    }}
                  >
                    {form.imagePreview ? (
                      <img src={form.imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 36 }}>{form.emoji}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{
                        padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                        border: "1.5px solid var(--border)", background: "#fff",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      📁 Upload Gambar…
                    </button>
                    {form.imagePreview && (
                      <button
                        onClick={() => setForm((f) => ({ ...f, imageFile: null, imagePreview: "" }))}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12,
                          border: "1px solid #FFD5D5", background: "#FFF0F0",
                          color: "var(--red)", cursor: "pointer",
                        }}
                      >
                        🗑️ Hapus Gambar
                      </button>
                    )}
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>
                      JPG / PNG / WEBP, max ~500 KB.<br/>Jika tidak ada gambar, emoji digunakan.
                    </p>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Emoji picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Emoji (cadangan jika tidak ada gambar)
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: 6,
                    padding: "10px",
                    background: "var(--bg)", borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    maxHeight: 120, overflowY: "auto",
                  }}
                >
                  {EMOJI_SUGGESTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                      style={{
                        fontSize: 22, padding: 4, borderRadius: 6, border: "none",
                        background: form.emoji === em ? "var(--teal-light)" : "transparent",
                        cursor: "pointer", lineHeight: 1,
                        outline: form.emoji === em ? "2px solid var(--teal)" : "none",
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Atau ketik emoji:</span>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                    style={{
                      width: 60, padding: "5px 10px", borderRadius: 8, fontSize: 20,
                      border: "1.5px solid var(--border)", outline: "none", textAlign: "center",
                    }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Nama Produk <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Cappuccino"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                    border: "1.5px solid var(--border)", outline: "none", color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Price + Category row */}
              <div className="flex gap-3">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Harga ($) <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                      border: "1.5px solid var(--border)", outline: "none", color: "var(--text)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Exclude<Category, "All"> }))}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
                      border: "1.5px solid var(--border)", outline: "none",
                      color: "var(--text)", background: "#fff", cursor: "pointer",
                    }}
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10,
                    border: "1.5px solid var(--border)", background: "#fff",
                    fontSize: 14, fontWeight: 600, color: "var(--muted)", cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 2, padding: 12, borderRadius: 10, border: "none",
                    background: "var(--teal)", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {editItem ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm !== null && (
        <ModalOverlay onClose={() => setDeleteConfirm(null)}>
          <div style={{ width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Hapus Produk?</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
              Produk{" "}
              <strong>
                {products.find((p) => p.id === deleteConfirm)?.name}
              </strong>{" "}
              akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: 12, borderRadius: 10,
                  border: "1.5px solid var(--border)", background: "#fff",
                  fontSize: 14, fontWeight: 600, color: "var(--muted)", cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: 12, borderRadius: 10, border: "none",
                  background: "var(--red)", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProductCard({
  item,
  image,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  image?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "var(--shadow)", overflow: "hidden",
        border: "1.5px solid transparent", transition: "all .15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--teal)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}
    >
      {/* Image / Emoji area */}
      <div
        style={{
          height: 120, background: "var(--teal-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        {image ? (
          <img src={image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 56 }}>{item.emoji}</span>
        )}
        {/* Category badge */}
        <span
          style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(43,191,173,.85)", color: "#fff",
            fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
          }}
        >
          {item.category}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }} className="truncate">
          {item.name}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--teal)", marginBottom: 10 }}>
          ${item.price.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1.5px solid var(--teal)", background: "var(--teal-light)",
              color: "var(--teal)", cursor: "pointer",
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid #FFD5D5", background: "#FFF0F0",
              color: "var(--red)", cursor: "pointer",
            }}
          >
            🗑️ Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 18,
          padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          maxHeight: "90vh", overflowY: "auto",
          width: "100%", maxWidth: 540,
        }}
      >
        {children}
      </div>
    </div>
  );
}
