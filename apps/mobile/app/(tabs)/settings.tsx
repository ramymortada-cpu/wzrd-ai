import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../src/lib/store";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  };

  const settingsItems = [
    { icon: "person-outline", label: "معلوماتي", desc: user?.email || "" },
    { icon: "key-outline", label: "مفاتيح API للمطورين", desc: "أنشئ وأدر مفاتيح API" },
    { icon: "notifications-outline", label: "الإشعارات", desc: "إعدادات التنبيهات" },
    { icon: "shield-outline", label: "الأمان", desc: "كلمة المرور والجلسات" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>الإعدادات</Text>
      </View>

      {/* User Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <View>
          <Text style={styles.userRole}>{user?.role || "مالك"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>
      </View>

      {/* Settings Items */}
      {settingsItems.map((item, i) => (
        <TouchableOpacity key={i} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            {item.desc && <Text style={styles.itemDesc}>{item.desc}</Text>}
          </View>
          <Ionicons name={item.icon as any} size={20} color="#64748b" />
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#f87171" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>رَدّ AI — v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "800", color: "#f1f5f9" },
  profileCard: {
    margin: 16, backgroundColor: "#1e293b", borderRadius: 16,
    padding: 20, flexDirection: "row", alignItems: "center", gap: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#312e81", justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#a5b4fc" },
  userRole: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", textAlign: "right" },
  userEmail: { fontSize: 13, color: "#64748b", textAlign: "right" },
  item: {
    marginHorizontal: 16, marginBottom: 4, backgroundColor: "#1e293b",
    borderRadius: 12, padding: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  itemLeft: { flex: 1, alignItems: "flex-end" },
  itemLabel: { fontSize: 15, fontWeight: "600", color: "#f1f5f9" },
  itemDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  logoutBtn: {
    margin: 16, marginTop: 24, backgroundColor: "#1e293b",
    borderRadius: 12, padding: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: "#7f1d1d",
  },
  logoutText: { color: "#f87171", fontWeight: "700", fontSize: 15 },
  footer: { alignItems: "center", padding: 24 },
  version: { color: "#334155", fontSize: 12 },
});
