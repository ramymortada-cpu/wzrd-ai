"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import SASidebar from "@/components/superadmin/sa-sidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (!isSuperAdmin()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden" dir="rtl">
      <SASidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">{children}</main>
    </div>
  );
}
