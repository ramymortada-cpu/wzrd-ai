import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEscalations, resolveEscalation, getAgentAssist } from "../../src/lib/api";
import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
dayjs.extend(relativeTime);
dayjs.locale("ar");

export default function EscalationsScreen() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assists, setAssists] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["escalations"],
    queryFn: () => getEscalations("pending"),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => resolveEscalation(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalations"] });
      Alert.alert("تم", "تم حل التصعيد بنجاح ✅");
    },
  });

  const fetchAssist = async (escalationId: string) => {
    try {
      const data = await getAgentAssist(escalationId);
      setAssists((prev) => ({ ...prev, [escalationId]: data.suggestion || data.reply_suggestion || "" }));
    } catch {
      Alert.alert("خطأ", "فشل الحصول على اقتراح AI");
    }
  };

  const escalations = data?.escalations || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>التصعيدات المعلقة</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{escalations.length}</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6366f1" />}
      >
        {escalations.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد تصعيدات معلقة 🎉</Text>
          </View>
        )}

        {escalations.map((esc: any) => (
          <TouchableOpacity
            key={esc.id}
            style={styles.card}
            onPress={() => setExpandedId(expandedId === esc.id ? null : esc.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.phone}>{esc.customer_phone || "عميل"}</Text>
              <Text style={styles.time}>{dayjs(esc.created_at).fromNow()}</Text>
            </View>
            <Text style={styles.intent} numberOfLines={2}>
              {esc.last_message || esc.intent || "بلا وصف"}
            </Text>

            {expandedId === esc.id && (
              <View style={styles.actions}>
                {assists[esc.id] ? (
                  <View style={styles.suggestion}>
                    <Text style={styles.suggestionLabel}>💡 اقتراح AI:</Text>
                    <Text style={styles.suggestionText}>{assists[esc.id]}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.assistBtn} onPress={() => fetchAssist(esc.id)}>
                    <Text style={styles.assistBtnText}>✨ اقتراح AI</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => resolveMutation.mutate({ id: esc.id })}
                >
                  <Text style={styles.resolveBtnText}>✅ حل التصعيد</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 24, paddingTop: 60,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  badge: { backgroundColor: "#dc2626", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  card: {
    margin: 16, marginTop: 0, backgroundColor: "#1e293b",
    borderRadius: 16, padding: 20,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  phone: { color: "#6366f1", fontWeight: "700", fontSize: 15 },
  time: { color: "#64748b", fontSize: 12 },
  intent: { color: "#94a3b8", fontSize: 14, lineHeight: 22, textAlign: "right" },
  actions: { marginTop: 16, gap: 10 },
  suggestion: { backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#4f46e5", borderRadius: 12, padding: 14 },
  suggestionLabel: { color: "#818cf8", fontSize: 12, fontWeight: "700", textAlign: "right", marginBottom: 6 },
  suggestionText: { color: "#e2e8f0", fontSize: 14, lineHeight: 22, textAlign: "right" },
  assistBtn: { backgroundColor: "#312e81", borderRadius: 10, padding: 12, alignItems: "center" },
  assistBtnText: { color: "#a5b4fc", fontWeight: "700" },
  resolveBtn: { backgroundColor: "#14532d", borderRadius: 10, padding: 12, alignItems: "center" },
  resolveBtnText: { color: "#4ade80", fontWeight: "700" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  emptyText: { color: "#64748b", fontSize: 18 },
});
