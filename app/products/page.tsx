import ProductsPageClient from "@/components/admin/ProductsPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produk – PosyMart" };

export default function ProductsPage() {
  return <ProductsPageClient />;
}
