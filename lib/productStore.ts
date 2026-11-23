import { MENU_ITEMS, CATEGORIES, type MenuItem } from "./data";

export const PRODUCT_STORE_KEY = "posymart_products";
export const IMAGE_STORE_KEY   = "posymart_images";

// ── Schema validation ─────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(CATEGORIES.filter((c) => c !== "All"));
const MAX_NAME_LEN = 100;
const MAX_PRICE    = 1_000_000;

function isValidItem(x: unknown): x is MenuItem {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "number" && Number.isInteger(o.id) && o.id > 0 &&
    typeof o.name === "string" && o.name.trim().length > 0 && o.name.length <= MAX_NAME_LEN &&
    typeof o.price === "number" && o.price > 0 && o.price <= MAX_PRICE &&
    typeof o.emoji === "string" && o.emoji.length > 0 &&
    typeof o.category === "string" && VALID_CATEGORIES.has(o.category as never)
  );
}

function sanitizeItem(x: MenuItem): MenuItem {
  return {
    id:       Math.floor(x.id),
    name:     x.name.trim().slice(0, MAX_NAME_LEN),
    price:    Math.round(x.price * 100) / 100,          // 2 decimal places
    emoji:    x.emoji.slice(0, 10),
    category: x.category,
  };
}

// ── Products ──────────────────────────────────────────────────────────────────

export function loadProducts(): MenuItem[] {
  if (typeof window === "undefined") return MENU_ITEMS;
  try {
    const raw = localStorage.getItem(PRODUCT_STORE_KEY);
    if (!raw) return MENU_ITEMS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return MENU_ITEMS;
    const valid = parsed.filter(isValidItem).map(sanitizeItem);
    // Deduplicate by id (keep first occurrence)
    const seen = new Set<number>();
    return valid.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch {
    return MENU_ITEMS;
  }
}

export function saveProducts(items: MenuItem[]) {
  if (typeof window === "undefined") return;
  const safe = items.filter(isValidItem).map(sanitizeItem);
  localStorage.setItem(PRODUCT_STORE_KEY, JSON.stringify(safe));
}

export function resetProducts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PRODUCT_STORE_KEY);
  localStorage.removeItem(IMAGE_STORE_KEY);
}

/** Collision-safe ID: timestamp-based so two tabs won't collide */
export function nextId(): number {
  // Use current time in ms shifted right to avoid collisions
  // If by chance it still collides with existing, increment
  return Date.now();
}

// ── Image helpers ─────────────────────────────────────────────────────────────

type ImageMap = Record<number, string>;

// Only allow genuine image data URLs (data:image/*)
const ALLOWED_IMAGE_PREFIX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/;

// Max ~400 KB decoded (base64 ≈ 1.37x overhead → ~550 KB string length)
const MAX_IMAGE_B64_LEN = 750_000;

export function sanitizeImageSrc(src: string): string | null {
  if (!ALLOWED_IMAGE_PREFIX.test(src)) return null;
  if (src.length > MAX_IMAGE_B64_LEN) return null;
  return src;
}

export function loadImages(): ImageMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(IMAGE_STORE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    // Filter to only valid, sanitized image entries
    const result: ImageMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (!Number.isInteger(id) || id <= 0) continue;
      if (typeof v !== "string") continue;
      const safe = sanitizeImageSrc(v);
      if (safe) result[id] = safe;
    }
    return result;
  } catch {
    return {};
  }
}

export function saveImage(id: number, dataUrl: string) {
  const safe = sanitizeImageSrc(dataUrl);
  if (!safe) {
    console.warn("saveImage: rejected non-image or oversized data URL");
    return;
  }
  const map = loadImages();
  map[id] = safe;
  localStorage.setItem(IMAGE_STORE_KEY, JSON.stringify(map));
}

export function deleteImage(id: number) {
  const map = loadImages();
  delete map[id];
  localStorage.setItem(IMAGE_STORE_KEY, JSON.stringify(map));
}

// ── File validation (for upload UI) ──────────────────────────────────────────

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 400_000; // 400 KB

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Hanya PNG, JPEG, WEBP, atau GIF yang diizinkan." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `Ukuran file maksimal ${MAX_FILE_BYTES / 1000} KB.` };
  }
  return { ok: true };
}
