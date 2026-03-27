/**
 * User settings — tabs (WhatsApp linking for Phase 3).
 */
import { useState, useEffect } from "react";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import type { AuthMe } from "@/lib/routerTypes";
import WhatsAppSettings from "./settings/WhatsAppSettings";

export type SettingsTab = "whatsapp";

export default function SettingsPage({ defaultTab }: { defaultTab?: SettingsTab }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab || "whatsapp");
  const [user, setUser] = useState<AuthMe>(null);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    fetch("/api/trpc/auth.me")
      .then((r) => r.json())
      .then((d) => setUser(d.result?.data?.json ?? d.result?.data))
      .catch(() => {});
  }, []);

  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: "whatsapp", label: "واتساب", icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={user?.credits} />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">الإعدادات</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">إدارة الربط مع القنوات والتفضيلات</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span className="me-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "whatsapp" && <WhatsAppSettings />}
      </div>
    </div>
  );
}
