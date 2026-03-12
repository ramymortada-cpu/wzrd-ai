import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "../../src/lib/api";
import { useState } from "react";
import { router } from "expo-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
dayjs.extend(relativeTime);
dayjs.locale("ar");

const RESOLUTION_COLORS: Record<string, string> = {
  auto_rag: "#22c55e",
  auto_template: "#3b82f6",
  escalated_no_answer: "#f59e0b",
  escalated_low_confidence: "#f97316",
  human: "#a855f7",
};

export default function ConversationsScreen() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["conversations", page, search],
    queryFn: () => getConversations(page, search || undefined),
  });

  const conversations = data?.conversations || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>المحادثات</Text>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.search}
          placeholder="ابحث عن محادثة..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          textAlign="right"
        />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c: any) => c.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6366f1" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.dot, { backgroundColor: RESOLUTION_COLORS[item.resolution_type] || "#64748b" }]} />
              <Text style={styles.intent} numberOfLines={1}>{item.intent || "بلا نية"}</Text>
              <Text style={styles.time}>{dayjs(item.created_at).fromNow()}</Text>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.dialect}>{item.dialect || "ar"}</Text>
              <Text style={styles.confidence}>{(item.confidence_score * 100).toFixed(0)}%</Text>
              <Text style={styles.msgCount}>{item.message_count} رسائل</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد محادثات</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  searchWrapper: { paddingHorizontal: 16, marginBottom: 12 },
  search: {
    backgroundColor: "#1e293b", borderRadius: 12, padding: 14,
    color: "#f1f5f9", fontSize: 15, borderWidth: 1, borderColor: "#334155",
  },
  card: {
    margin: 8, marginTop: 0, marginHorizontal: 16,
    backgroundColor: "#1e293b", borderRadius: 12, padding: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  intent: { flex: 1, color: "#f1f5f9", fontSize: 14, fontWeight: "600", textAlign: "right" },
  time: { color: "#64748b", fontSize: 12 },
  cardBottom: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  dialect: { color: "#64748b", fontSize: 12 },
  confidence: { color: "#6366f1", fontSize: 12, fontWeight: "600" },
  msgCount: { color: "#64748b", fontSize: 12 },
  empty: { flex: 1, alignItems: "center", paddingVertical: 80 },
  emptyText: { color: "#475569", fontSize: 16 },
});
