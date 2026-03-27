/**
 * WhatsApp account linking — settings subsection.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const defaultWaDigits = import.meta.env.VITE_WHATSAPP_E164 as string | undefined;

export default function WhatsAppSettings() {
  const [phone, setPhone] = useState("");
  const utils = trpc.useUtils();

  const { data: status, isLoading } = trpc.whatsapp.status.useQuery();

  const linkMutation = trpc.whatsapp.link.useMutation({
    onSuccess: () => {
      void utils.whatsapp.status.invalidate();
      setPhone("");
    },
  });

  const unlinkMutation = trpc.whatsapp.unlink.useMutation({
    onSuccess: () => {
      void utils.whatsapp.status.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const waMe = (defaultWaDigits || "201107107012").replace(/\D/g, "");

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">واتساب</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          ربط رقم واتساب بحسابك عشان تستخدم الكوبايلوت مباشرة من واتساب
        </p>
      </div>

      {status?.linked ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            </div>
            <div>
              <p className="text-zinc-900 dark:text-white font-medium">مربوط</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm" dir="ltr">
                +{status.phone}
              </p>
            </div>
          </div>

          {status.linkedAt && (
            <p className="text-zinc-400 dark:text-zinc-500 text-xs">
              تم الربط في {new Date(status.linkedAt).toLocaleDateString("ar-EG")}
            </p>
          )}

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
              افتح واتساب وابعت رسالة لرقم Wzrd الرسمي:
            </p>
            <a
              href={`https://wa.me/${waMe}?text=${encodeURIComponent("مرحبا")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-500/25 transition-colors"
            >
              <span>💬</span>
              افتح واتساب
            </a>
          </div>

          <button
            type="button"
            onClick={() => unlinkMutation.mutate()}
            disabled={unlinkMutation.isPending}
            className="w-full py-2 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {unlinkMutation.isPending ? "جاري الفك..." : "فك الربط"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-500 text-lg">📱</span>
            </div>
            <div>
              <p className="text-zinc-900 dark:text-white font-medium">غير مربوط</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">ادخل رقمك عشان تربط الحساب</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 text-sm mb-1.5">
                رقم الواتساب (بالكود الدولي)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 201012345678"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
              />
              <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">
                بدون + في الحقل — مثال: 201012345678
              </p>
            </div>

            {linkMutation.isError && (
              <p className="text-red-600 dark:text-red-400 text-sm">{linkMutation.error.message}</p>
            )}

            {linkMutation.data?.success && (
              <p className="text-green-600 dark:text-green-400 text-sm">{linkMutation.data.message}</p>
            )}

            <button
              type="button"
              onClick={() => linkMutation.mutate({ phone })}
              disabled={!phone.trim() || linkMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium hover:from-indigo-700 hover:to-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {linkMutation.isPending ? "جاري الربط..." : "ربط الرقم"}
            </button>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">إزاي بيشتغل</p>
            <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-xs list-disc list-inside">
              <li>ادخل رقم واتساب اللي هتبعت منه للبوت</li>
              <li>اضغط ربط الرقم</li>
              <li>ابعت رسالة من نفس الرقم على واتساب</li>
              <li>الكوبايلوت هيستخدم سياق البراند والكريدت من حسابك</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
