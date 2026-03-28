import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getChurnRadar, getAgentPerformance, getBenchmark } from "../../src/lib/api";
import { useState } from "react";

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: churn, refetch: refetchChurn } = useQuery({
    queryKey: ["churn-radar"],
    queryFn: () => getChurnRadar(45),
  });

  const { data: agentPerf, refetch: refetchAgent } = useQuery({
    queryKey: ["agent-performance"],
    queryFn: getAgentPerformance,
  });

  const { data: benchmark, refetch: refetchBenchmark } = useQuery({
    queryKey: ["benchmark"],
    queryFn: getBenchmark,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchChurn(), refetchAgent(), refetchBenchmark()]);
    setRefreshing(false);
  };

  const atRiskCount = churn?.at_risk_customers?.length || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>تحليلات الأداء</Text>
      </View>

      {/* Churn Radar */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📡 Churn Radar</Text>
        <View style={styles.churnSummary}>
          <View style={styles.churnStat}>
            <Text style={[styles.churnNumber, { color: "#dc2626" }]}>{atRiskCount}</Text>
            <Text style={styles.churnLabel}>عميل في خطر</Text>
          </View>
          <View style={styles.churnStat}>
            <Text style={[styles.churnNumber, { color: "#f59e0b" }]}>
              {churn?.at_risk_customers?.filter((c: any) => c.risk_level === "HIGH").length || 0}
            </Text>
            <Text style={styles.churnLabel}>خطر عالي</Text>
          </View>
        </View>
        {churn?.at_risk_customers?.slice(0, 3).map((c: any, i: number) => (
          <View key={i} style={styles.churnRow}>
            <Text style={[styles.riskBadge, c.risk_level === "CRITICAL" ? styles.critical : styles.high]}>
              {c.risk_level}
            </Text>
            <Text style={styles.churnInfo}>{c.phone || `عميل #${i + 1}`} — {c.days_inactive} يوم</Text>
          </View>
        ))}
      </View>

      {/* Benchmark */}
      {benchmark?.available && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 مقارنة بالمتاجر المماثلة</Text>
          <Text style={styles.percentile}>المرتبة: {benchmark.percentile}% من متاجر {benchmark.sector}</Text>
          {benchmark.gap_analysis?.map((g: any, i: number) => (
            <View key={i} style={styles.gapRow}>
              <Text style={styles.gapMetric}>{g.metric}</Text>
              <Text style={styles.gapValues}>
                أنت: {g.yours}% | السوق: {g.benchmark}%
              </Text>
            </View>
          ))}
          {benchmark.recommendations?.map((r: string, i: number) => (
            <Text key={i} style={styles.recommendation}>• {r}</Text>
          ))}
        </View>
      )}

      {/* Agent Performance */}
      {agentPerf?.agents?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 أداء الوكلاء</Text>
          {agentPerf.agents.map((agent: any, i: number) => (
            <View key={i} style={styles.agentRow}>
              <Text style={styles.agentName}>{agent.agent_id?.slice(0, 8) || `وكيل ${i + 1}`}</Text>
              <Text style={styles.agentStat}>{agent.resolved} تم الحل</Text>
              <Text style={styles.agentStat}>{agent.csat_score?.toFixed(1)} ⭐</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  card: {
    margin: 16, marginTop: 0, backgroundColor: "#1e293b",
    borderRadius: 16, padding: 20, marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", textAlign: "right", marginBottom: 16 },
  churnSummary: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  churnStat: { alignItems: "center" },
  churnNumber: { fontSize: 32, fontWeight: "900" },
  churnLabel: { fontSize: 12, color: "#64748b" },
  churnRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#334155",
  },
  riskBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    fontSize: 11, fontWeight: "700",
  },
  critical: { backgroundColor: "#7f1d1d", color: "#fca5a5" },
  high: { backgroundColor: "#78350f", color: "#fcd34d" },
  churnInfo: { color: "#94a3b8", fontSize: 13 },
  percentile: { color: "#6366f1", fontWeight: "600", textAlign: "right", marginBottom: 12 },
  gapRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155",
  },
  gapMetric: { color: "#94a3b8", fontSize: 13 },
  gapValues: { color: "#f1f5f9", fontSize: 13 },
  recommendation: { color: "#94a3b8", fontSize: 13, marginTop: 8, lineHeight: 20, textAlign: "right" },
  agentRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155",
  },
  agentName: { color: "#f1f5f9", fontWeight: "600", fontSize: 13 },
  agentStat: { color: "#64748b", fontSize: 13 },
});
