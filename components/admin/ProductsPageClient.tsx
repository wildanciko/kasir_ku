"use client";

import AuthGuard from "@/components/AuthGuard";
import AdminSidebar from "./AdminSidebar";
import Topbar from "@/components/Topbar";
import { ProductsPanel } from "@/components/ProductsClient";
import IdleWarning from "@/components/IdleWarning";

export default function ProductsPageClient() {
  return (
    <AuthGuard allowedRoles={["Admin", "Owner"]}>
      {(user) => (
        <>
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
          <IdleWarning />
        </>
      )}
    </AuthGuard>
  );
}
