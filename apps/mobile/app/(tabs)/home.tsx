import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getRaddScore, getBriefing, getUpcomingSeasons } from "../../src/lib/api";
import { useState } from "react";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(7),
  });

  const { data: score, refetch: refetchScore } = useQuery({
    queryKey: ["radd-score"],
    queryFn: getRaddScore,
  });

  const { data: briefing, refetch: refetchBriefing } = useQuery({
    queryKey: ["briefing"],
    queryFn: getBriefing,
  });

  const { data: seasons, refetch: refetchSeasons } = useQuery({
    queryKey: ["seasons"],
    queryFn: getUpcomingSeasons,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchScore(), refetchBriefing(), refetchSeasons()]);
    setRefreshing(false);
  };

  const urgentSeason = seasons?.seasons?.find((s: any) => s.urgency === "critical" || s.urgency === "warning");

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>مرحباً 👋</Text>
        <Text style={styles.subtitle}>آخر 7 أيام</Text>
      </View>

      {/* RADD Score */}
      {score && (
        <View style={[styles.card, styles.scoreCard]}>
          <View>
            <Text style={styles.cardLabel}>RADD Score</Text>
            <Text style={styles.scoreValue}>{score.score ?? "--"}</Text>
            <Text style={styles.scoreGrade}>{score.grade ?? ""}</Text>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreCircleText}>{score.score ?? "--"}</Text>
          </View>
        </View>
      )}

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{stats?.total_conversations ?? "--"}</Text>
          <Text style={styles.kpiLabel}>محادثة</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: "#22c55e" }]}>
            {stats?.automation_rate ? `${(stats.automation_rate * 100).toFixed(0)}%` : "--"}
          </Text>
          <Text style={styles.kpiLabel}>أتمتة</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: "#f59e0b" }]}>
            {stats?.escalation_rate ? `${(stats.escalation_rate * 100).toFixed(0)}%` : "--"}
          </Text>
          <Text style={styles.kpiLabel}>تصعيد</Text>
        </View>
      </View>

      {/* Seasonal Alert */}
      {urgentSeason && (
        <View style={[styles.card, { backgroundColor: urgentSeason.urgency === "critical" ? "#7f1d1d" : "#78350f" }]}>
          <Text style={styles.seasonEmoji}>
            {urgentSeason.urgency === "critical" ? "🔥" : "📅"}
          </Text>
          <Text style={styles.seasonText}>{urgentSeason.message_ar}</Text>
        </View>
      )}

      {/* Morning Briefing */}
      {briefing?.summary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>☀️ إحاطة الصباح</Text>
          <Text style={styles.briefingText}>{briefing.summary}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 28, fontWeight: "800", color: "#f1f5f9", textAlign: "right" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "right", marginTop: 4 },
  card: {
    margin: 16, marginTop: 0, backgroundColor: "#1e293b",
    borderRadius: 16, padding: 20,
  },
  scoreCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginHorizontal: 16, marginBottom: 16,
  },
  cardLabel: { fontSize: 12, color: "#64748b", textAlign: "right" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", textAlign: "right", marginBottom: 12 },
  scoreValue: { fontSize: 48, fontWeight: "900", color: "#6366f1", textAlign: "right" },
  scoreGrade: { fontSize: 14, color: "#94a3b8", textAlign: "right" },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#312e81", justifyContent: "center", alignItems: "center",
  },
  scoreCircleText: { fontSize: 28, fontWeight: "900", color: "#a5b4fc" },
  kpiRow: {
    flexDirection: "row", gap: 12,
    marginHorizontal: 16, marginBottom: 16,
  },
  kpiCard: {
    flex: 1, backgroundColor: "#1e293b", borderRadius: 12,
    padding: 16, alignItems: "center",
  },
  kpiValue: { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  kpiLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  seasonEmoji: { fontSize: 24, textAlign: "right", marginBottom: 8 },
  seasonText: { fontSize: 14, color: "#fef3c7", textAlign: "right", lineHeight: 22 },
  briefingText: { fontSize: 14, color: "#94a3b8", textAlign: "right", lineHeight: 22 },
});
