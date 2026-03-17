"use client";

import { useState } from "react";

const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
const modalBox = "bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4";
const inputClass = "w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500";
const btnPrimary = "bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50";
const btnSecondary = "bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-md";

export function RuleFormModal({
  onClose,
  onSubmit,
  initial,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; is_active: boolean; priority: number }) => void;
  initial?: { name: string; description: string; is_active: boolean; priority: number };
  loading?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [priority, setPriority] = useState(initial?.priority ?? 0);

  return (
    <div className={modalOverlay} dir="rtl">
      <div className={modalBox}>
        <h2 className="text-base font-semibold text-white">{initial ? "تعديل القاعدة" : "قاعدة جديدة"}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="اسم القاعدة"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">الوصف</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="وصف اختياري"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">الأولوية (0 = أقل)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
            نشط
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => onSubmit({ name, description, is_active: isActive, priority })} disabled={loading || !name.trim()} className={btnPrimary}>
            {loading ? "جاري..." : "حفظ"}
          </button>
          <button onClick={onClose} className={btnSecondary}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export function IntegrationModal({
  type,
  onClose,
  onSubmit,
  loading,
}: {
  type: "salla" | "zid" | "starter";
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  loading?: boolean;
}) {
  const [token, setToken] = useState("");
  const [sector, setSector] = useState("perfumes");
  const [storeId, setStoreId] = useState("");

  const titles = { salla: "مزامنة Salla", zid: "مزامنة Zid", starter: "Starter Pack" };

  return (
    <div className={modalOverlay} dir="rtl">
      <div className={modalBox}>
        <h2 className="text-base font-semibold text-white">{titles[type]}</h2>
        {type === "salla" && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Salla API Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={inputClass}
              placeholder="أدخل التوكن"
              autoComplete="off"
            />
          </div>
        )}
        {type === "zid" && (
          <>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Zid Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={inputClass}
                placeholder="أدخل التوكن"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Store ID (اختياري)</label>
              <input type="text" value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputClass} />
            </div>
          </>
        )}
        {type === "starter" && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">القطاع</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className={inputClass}>
              <option value="perfumes">عطور</option>
              <option value="fashion">أزياء</option>
              <option value="electronics">إلكترونيات</option>
              <option value="food">طعام</option>
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              if (type === "salla") onSubmit({ salla_token: token });
              else if (type === "zid") onSubmit({ zid_token: token, store_id: storeId });
              else onSubmit({ sector });
            }}
            disabled={loading || (type !== "starter" && !token.trim())}
            className={btnPrimary}
          >
            {loading ? "جاري..." : "تشغيل"}
          </button>
          <button onClick={onClose} className={btnSecondary}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export function KBDocCreateModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; content_type: string }) => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("general");

  return (
    <div className={modalOverlay} dir="rtl">
      <div className={modalBox}>
        <h2 className="text-base font-semibold text-white">وثيقة جديدة</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">العنوان</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="عنوان الوثيقة" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">النوع</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={inputClass}>
              <option value="general">عام</option>
              <option value="faq">أسئلة شائعة</option>
              <option value="policy">سياسة</option>
              <option value="product_info">معلومات منتج</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">المحتوى</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className={inputClass + " min-h-[120px]"} placeholder="محتوى الوثيقة" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => onSubmit({ title, content, content_type: contentType })} disabled={loading || !title.trim() || content.length < 10} className={btnPrimary}>
            {loading ? "جاري..." : "إنشاء"}
          </button>
          <button onClick={onClose} className={btnSecondary}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
