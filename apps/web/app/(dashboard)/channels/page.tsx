"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Channel {
  id: string;
  type: string;
  name: string;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

const getChannels = () => apiFetch<{ channels: Channel[] }>("/admin/channels");

const CHANNEL_META: Record<string, { icon: string; label: string; color: string; setupPath: string }> = {
  whatsapp: { icon: "💬", label: "WhatsApp", color: "text-green-600", setupPath: "/settings" },
  instagram: { icon: "📸", label: "Instagram DM", color: "text-pink-600", setupPath: "/settings" },
  zid: { icon: "🛒", label: "Zid — زد", color: "text-blue-600", setupPath: "/settings" },
  salla: { icon: "🏪", label: "Salla — سلة", color: "text-orange-600", setupPath: "/settings" },
  shopify: { icon: "🛍️", label: "Shopify", color: "text-emerald-600", setupPath: "/settings" },
};

const ALL_CHANNELS = ["whatsapp", "instagram", "salla", "shopify", "zid"];

export default function ChannelsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["channels"], queryFn: getChannels });

  const activeTypes = new Set((data?.channels || []).filter((c) => c.is_active).map((c) => c.type));

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">القنوات المتصلة</h1>
        <p className="text-slate-400 text-sm mt-1">
          شاهد حالة جميع قنوات التواصل المتصلة بـ رَدّ AI
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-indigo-400 w-8 h-8" />
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4">
          {ALL_CHANNELS.map((type) => {
            const meta = CHANNEL_META[type];
            const isActive = activeTypes.has(type);
            const channel = data?.channels?.find((c) => c.type === type);

            return (
              <div
                key={type}
                className={`rounded-xl border p-5 flex items-center justify-between
                  ${isActive
                    ? "border-green-800 bg-green-950/20"
                    : "border-slate-700 bg-slate-800/40"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{meta.icon}</span>
                  <div>
                    <h3 className={`text-lg font-bold ${meta.color}`}>{meta.label}</h3>
                    {isActive ? (
                      <p className="text-sm text-green-400 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        متصل ويعمل
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <XCircle className="w-3.5 h-3.5" />
                        غير متصل
                      </p>
                    )}
                    {channel && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        متصل منذ {new Date(channel.created_at).toLocaleDateString("ar")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-green-900/50 text-green-400 px-3 py-1.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      نشط
                    </span>
                  ) : (
                    <Link
                      href={meta.setupPath}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      إعداد الآن
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook Info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">روابط Webhook</h3>
        </div>
        <p className="text-sm text-slate-400 mb-2">
          عند إعداد أي منصة جديدة، ستجد روابط الـ Webhook الخاصة بها في{" "}
          <Link href="/settings" className="text-indigo-400 hover:underline">صفحة الإعدادات</Link>.
        </p>
      </div>
    </div>
  );
}
