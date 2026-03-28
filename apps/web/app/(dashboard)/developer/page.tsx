"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Key, Plus, Trash2, Copy, Check, Code, Loader2, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  expires_at: string | null;
}

const AVAILABLE_SCOPES = [
  { id: "conversations:read", label: "قراءة المحادثات" },
  { id: "messages:read", label: "قراءة الرسائل" },
  { id: "customers:read", label: "قراءة العملاء" },
  { id: "knowledge:read", label: "قراءة قاعدة المعرفة" },
  { id: "knowledge:write", label: "تحديث قاعدة المعرفة" },
  { id: "analytics:read", label: "قراءة التحليلات" },
  { id: "escalations:read", label: "قراءة التصعيدات" },
];

const getApiKeys = () => apiFetch<{ keys: ApiKey[] }>("/developer/api-keys");
const createApiKey = (data: { name: string; scopes: string[]; expires_days: number }) =>
  apiFetch<{ id: string; key: string; name: string; warning: string }>("/developer/api-keys", {
    method: "POST",
    body: JSON.stringify(data),
  });
const revokeApiKey = (id: string) =>
  apiFetch(`/developer/api-keys/${id}`, { method: "DELETE" });

export default function DeveloperPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["conversations:read", "analytics:read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["api-keys"], queryFn: getApiKeys });

  const { mutate: createKey, isPending: creating } = useMutation({
    mutationFn: createApiKey,
    onSuccess: (res) => {
      setCreatedKey(res.key);
      setShowCreate(false);
      setNewKeyName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const { mutate: revokeKey } = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code className="text-indigo-400 w-6 h-6" />
          <h1 className="text-2xl font-bold text-slate-100">واجهة المطورين (API)</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> مفتاح جديد
        </button>
      </div>

      {/* Created Key Alert */}
      {createdKey && (
        <div className="rounded-xl border border-green-700 bg-green-900/30 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-400 w-5 h-5" />
            <p className="text-amber-300 font-bold">احفظ هذا المفتاح الآن — لن يُعرض مجدداً</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400">
            <span className="flex-1 break-all">{createdKey}</span>
            <button onClick={() => handleCopy(createdKey)} className="text-slate-400 hover:text-white shrink-0">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-3 text-sm text-slate-400 hover:text-slate-200">
            تم الحفظ ✓
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">مفتاح API جديد</h3>
          <input
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="اسم المفتاح (مثلاً: تكامل ERP)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            dir="rtl"
          />

          <div>
            <p className="text-sm text-slate-400 mb-3">الصلاحيات (Scopes)</p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SCOPES.map((scope) => (
                <label key={scope.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope.id)}
                    onChange={() => toggleScope(scope.id)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm text-slate-200">{scope.label}</p>
                    <p className="text-xs text-slate-500 font-mono">{scope.id}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => createKey({ name: newKeyName, scopes: selectedScopes, expires_days: 365 })}
              disabled={!newKeyName || creating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="animate-spin w-4 h-4" /> : <Key className="w-4 h-4" />}
              إنشاء المفتاح
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-400" />
          مفاتيح API النشطة
        </h2>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-indigo-400 w-8 h-8" />
          </div>
        )}

        {!isLoading && (data?.keys?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-8 text-center text-slate-400">
            لا توجد مفاتيح بعد. أنشئ مفتاحاً جديداً.
          </div>
        )}

        <div className="space-y-3">
          {data?.keys?.map((key) => (
            <div key={key.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <div className="flex items-start justify-between mb-3">
                <button onClick={() => revokeKey(key.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <h4 className="text-slate-100 font-semibold">{key.name}</h4>
                  <p className="font-mono text-sm text-slate-400 mt-1">{key.key_prefix}***</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end mb-2">
                {key.scopes?.map((scope) => (
                  <span key={scope} className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                    {scope}
                  </span>
                ))}
              </div>
              {key.expires_at && (
                <p className="text-xs text-slate-500 text-right">
                  ينتهي: {new Date(key.expires_at).toLocaleDateString("ar")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Documentation */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-slate-400" />
          مثال على الاستخدام
        </h2>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
          <pre>{`# احصل على المحادثات
curl https://api.radd.ai/api/v1/developer/v1/conversations \\
  -H "Authorization: Bearer radd_YOUR_KEY_HERE"

# احصل على التحليلات
curl https://api.radd.ai/api/v1/developer/v1/analytics?period_days=30 \\
  -H "Authorization: Bearer radd_YOUR_KEY_HERE"`}</pre>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { endpoint: "GET /conversations", desc: "قائمة المحادثات" },
            { endpoint: "GET /analytics", desc: "إحصاءات الأداء" },
            { endpoint: "GET /customers", desc: "قائمة العملاء" },
            { endpoint: "GET /docs/openapi", desc: "توثيق كامل للـ API" },
          ].map((ep, i) => (
            <div key={i} className="bg-slate-900 rounded-lg p-3">
              <p className="font-mono text-xs text-indigo-400">{ep.endpoint}</p>
              <p className="text-xs text-slate-400 mt-1">{ep.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
