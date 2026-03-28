import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { login, getMe } from "../../src/lib/api";
import { useAuthStore } from "../../src/lib/store";

const DEFAULT_WORKSPACE =
  (typeof process !== "undefined" && process.env.EXPO_PUBLIC_WORKSPACE_SLUG) || "";

export default function LoginScreen() {
  const [workspaceSlug, setWorkspaceSlug] = useState(DEFAULT_WORKSPACE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    const slug = workspaceSlug.trim();
    if (!slug || !email || !password) {
      Alert.alert("تنبيه", "أدخل معرّف مساحة العمل (slug) والبريد وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const data = await login(slug, email, password);
      const user = await getMe();
      await setAuth(user, data.access_token);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert("خطأ في تسجيل الدخول", "تحقق من بريدك الإلكتروني وكلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>رَدّ AI</Text>
        <Text style={styles.subtitle}>لوحة تحكم المتجر</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="معرّف المتجر (workspace slug)"
            placeholderTextColor="#64748b"
            value={workspaceSlug}
            onChangeText={setWorkspaceSlug}
            autoCapitalize="none"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>تسجيل الدخول</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  logo: { fontSize: 42, fontWeight: "900", color: "#6366f1", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#94a3b8", textAlign: "center", marginBottom: 40 },
  form: { gap: 16 },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    color: "#f1f5f9",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
