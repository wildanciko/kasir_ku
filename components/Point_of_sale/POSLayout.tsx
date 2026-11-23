"use client";

import AuthGuard from "@/components/AuthGuard";
import POSSidebar from "./POSSidebar";
import OrderPanel from "./OrderPanel";
import IdleWarning from "@/components/IdleWarning";

export default function POSLayout() {
  return (
    <AuthGuard>
      {(user) => (
        <>
          <div className="flex h-full overflow-hidden">
            <POSSidebar user={user} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <OrderPanel user={user} />
            </div>
          </div>
          <IdleWarning />
        </>
      )}
    </AuthGuard>
  );
}
