"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  AlertTriangle,
  Package,
  Truck,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Eye,
} from "lucide-react";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRadarAlerts,
  triggerRadarScan,
  markAlertRead,
  type RadarAlert,
} from "@/lib/api";

const SEVERITY_STYLES: Record<string, string> = {
  low: "text-blue-600 bg-blue-50 border-blue-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  critical: "حرج",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  shipping_anomaly: <Truck className="h-4 w-4" />,
  product_issue: <Package className="h-4 w-4" />,
  demand_opportunity: <TrendingUp className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  shipping_anomaly: "شذوذ شحن",
  product_issue: "مشكلة منتج",
  demand_opportunity: "فرصة طلب",
};

export default function RadarPage() {
  const [alerts, setAlerts] = useState<RadarAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [scanMsg, setScanMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getRadarAlerts(unreadOnly, 1);
      setAlerts(data.items);
      setTotal(data.total);
    } catch {
      setError("تعذّر تحميل التنبيهات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [unreadOnly]);

  async function handleScan() {
    setScanning(true);
    setScanMsg("");
    try {
      const result = await triggerRadarScan();
      setScanMsg(`تم المسح — وُجد ${result.alerts_found} تنبيه جديد`);
      await load();
    } catch {
      setScanMsg("فشل المسح — حاول مرة أخرى");
    } finally {
      setScanning(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markAlertRead(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
    } catch {
      // silent fail
    }
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="الرادار التشغيلي"
        subtitle="كشف الشذوذات والفرص في الوقت الفعلي"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <Radar className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "جارٍ المسح..." : "مسح الآن"}
          </button>
          <button
            onClick={load}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer ms-auto">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded"
            />
            غير مقروءة فقط
          </label>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {unreadCount} غير مقروء
            </span>
          )}
        </div>

        {scanMsg && (
          <div className="text-sm text-primary bg-primary/10 px-4 py-3 rounded-lg">
            {scanMsg}
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-4 rounded-full bg-green-50 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">كل شيء تمام!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              لا توجد تنبيهات تشغيلية حالياً. استخدم زر "مسح الآن" لتحليل البيانات الحالية.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkRead={() => handleMarkRead(alert.id)}
              />
            ))}
            {total > alerts.length && (
              <p className="text-center text-sm text-muted-foreground py-2">
                يُعرض {alerts.length} من {total} تنبيه
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onMarkRead }: { alert: RadarAlert; onMarkRead: () => void }) {
  const severityStyle = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.medium;
  const typeIcon = TYPE_ICONS[alert.alert_type];
  const typeLabel = TYPE_LABELS[alert.alert_type] ?? alert.alert_type;

  return (
    <Card className={`border ${!alert.is_read ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border ${severityStyle} shrink-0 mt-0.5`}>
            {typeIcon ?? <AlertTriangle className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{alert.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${severityStyle}`}>
                {SEVERITY_LABELS[alert.severity] ?? alert.severity}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                {typeLabel}
              </span>
              {!alert.is_read && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  جديد
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            {alert.suggested_action && (
              <div className="mt-2 flex items-start gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">{alert.suggested_action}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {new Date(alert.created_at).toLocaleDateString("ar-SA")}
            </span>
            {!alert.is_read && (
              <button
                onClick={onMarkRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                تحديد كمقروء
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
