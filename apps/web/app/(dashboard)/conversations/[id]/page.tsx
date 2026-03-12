"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Send, CheckCheck, ShieldCheck, Info } from "lucide-react";
import TopBar from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  getConversation,
  sendAgentReply,
  type ConversationDetail,
  type Message,
} from "@/lib/api";
import {
  formatArabicDate,
  INTENT_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  confidenceColor,
  confidenceLabel,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Trust Ledger ──────────────────────────────────────────────────────────────
function TrustBadge({ confidence }: { confidence: NonNullable<Message["confidence"]> }) {
  const [open, setOpen] = useState(false);
  const min = Math.min(confidence.intent, confidence.retrieval, confidence.verify);

  const color =
    min >= 0.85
      ? "bg-green-100 text-green-700 hover:bg-green-200"
      : min >= 0.60
      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      : "bg-red-100 text-red-700 hover:bg-red-200";

  const label =
    min >= 0.85 ? "🟢 ثقة عالية" : min >= 0.60 ? "🟡 ثقة متوسطة" : "🔴 تم التحويل";

  const decision =
    min >= 0.85 ? "تم الرد تلقائياً" : min >= 0.60 ? "تم عرض مسودة على الموظف" : "تم التحويل للموظف";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("text-xs px-2 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1", color)}
      >
        <ShieldCheck className="h-3 w-3" />
        {label}
      </button>
      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 w-72 bg-white border border-border rounded-lg shadow-lg p-3 z-50 text-xs"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center gap-1.5 font-semibold mb-2 text-sm">
            <Info className="h-4 w-4 text-primary" />
            سجل الأمانة
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">تصنيف النية</span>
              <span className="font-medium">{(confidence.intent * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">جودة الاسترجاع</span>
              <span className="font-medium">{(confidence.retrieval * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">التحقق من الدقة</span>
              <span className="font-medium">{(confidence.verify * 100).toFixed(0)}%</span>
            </div>
            <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between">
              <span className="text-muted-foreground">القرار</span>
              <span className="font-semibold text-primary">{decision}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isCustomer = msg.sender_type === "customer";
  const isAgent = msg.sender_type === "agent";
  const isSystem = msg.sender_type === "system";

  return (
    <div className={cn("flex flex-col", isCustomer ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[70%] px-4 py-2.5 text-sm",
          isCustomer && "bubble-customer",
          !isCustomer && isAgent && "bubble-agent",
          !isCustomer && !isAgent && "bubble-system"
        )}
      >
        <p className="whitespace-pre-wrap arabic-text">{msg.content}</p>

        <div className="flex items-center justify-between gap-3 mt-1.5">
          <span className="text-xs text-muted-foreground">
            {formatArabicDate(msg.created_at)}
          </span>
        </div>
      </div>
      {/* Trust Ledger badge — only for system messages with confidence data */}
      {isSystem && msg.confidence && (
        <div className="mt-1 me-1">
          <TrustBadge confidence={msg.confidence} />
        </div>
      )}
    </div>
  );
}

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getConversation(params.id)
      .then(setConv)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages]);

  async function handleSend(resolve = false) {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await sendAgentReply(params.id, reply, resolve);
      setConv((c) =>
        c ? { ...c, messages: [...c.messages, msg] } : c
      );
      setReply("");
      if (resolve) router.push("/conversations");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="محادثة غير موجودة" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          لا توجد محادثة بهذا المعرف
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border bg-white shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {conv.customer?.display_name || "عميل"}
            </span>
            <Badge className={`${STATUS_COLORS[conv.status]} border-none text-xs`}>
              {STATUS_LABELS[conv.status] || conv.status}
            </Badge>
            {conv.intent && (
              <Badge variant="outline" className="text-xs">
                {INTENT_LABELS[conv.intent] || conv.intent}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {conv.messages.length} رسالة
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
        {conv.messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {conv.status !== "resolved" && (
        <div className="shrink-0 border-t border-border bg-white p-4">
          <Textarea
            placeholder="اكتب ردك هنا..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="mb-3 min-h-[80px] arabic-text"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) handleSend(false);
            }}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSend(true)}
              disabled={sending || !reply.trim()}
            >
              <CheckCheck className="h-4 w-4 me-1" />
              إرسال وإغلاق
            </Button>
            <Button
              size="sm"
              onClick={() => handleSend(false)}
              disabled={sending || !reply.trim()}
            >
              <Send className="h-4 w-4 me-1" />
              إرسال
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
