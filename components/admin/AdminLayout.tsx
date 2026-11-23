"use client";

import AuthGuard from "@/components/AuthGuard";
import AdminSidebar from "./AdminSidebar";
import Topbar from "@/components/Topbar";
import AdminOrderPanel from "./AdminOrderPanel";
import IdleWarning from "@/components/IdleWarning";

interface AdminLayoutProps {
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ title, subtitle }: AdminLayoutProps) {
  return (
    <AuthGuard allowedRoles={["Admin", "Owner"]}>
      {(user) => (
        <>
          <div className="flex h-full overflow-hidden">
            <AdminSidebar user={user} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Topbar
                user={user}
                title={title ?? `Welcome back, ${user.name.split(" ")[0]}! 👋`}
                subtitle={subtitle ?? "Here's what's happening with your store today."}
              />
              <AdminOrderPanel />
            </div>
          </div>
          <IdleWarning />
        </>
      )}
    </AuthGuard>
  );
}
