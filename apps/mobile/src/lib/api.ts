import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://api.radd.ai/api/v1";

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync("auth_token");
    }
    return Promise.reject(err);
  }
);

// ─── Auth (FastAPI يتطلب workspace_slug مع البريد وكلمة المرور) ──────────────
export const login = (workspaceSlug: string, email: string, password: string) =>
  api
    .post("/auth/login", { workspace_slug: workspaceSlug, email, password })
    .then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);

// ─── Dashboard KPIs — نفس مسار الويب: /admin/analytics ───────────────────────
export const getDashboardStats = (_periodDays = 7) =>
  api.get("/admin/analytics").then((r) => r.data);

export const getRaddScore = (periodDays = 30) =>
  api.get("/admin/radd-score", { params: { period_days: periodDays } }).then((r) => r.data);

// ─── Conversations ────────────────────────────────────────────────────────────
export const getConversations = (page = 1, status?: string) =>
  api.get("/conversations", { params: { page, ...(status ? { status } : {}) } }).then((r) => r.data);

/** تفاصيل المحادثة + الرسائل (لا يوجد GET .../messages في الـ API) */
export const getConversationDetail = (id: string) => api.get(`/conversations/${id}`).then((r) => r.data);

// ─── Escalations ─────────────────────────────────────────────────────────────
export const getEscalations = (status?: string) =>
  api.get("/escalations", { params: { status } }).then((r) => r.data);

export const acceptEscalation = (id: string) =>
  api.post(`/escalations/${id}/accept`).then((r) => r.data);

export const resolveEscalation = (id: string, notes?: string) =>
  api.post(`/escalations/${id}/resolve`, { notes: notes ?? null }).then((r) => r.data);

export const getAgentAssist = (escalationId: string) =>
  api.get(`/admin/escalations/${escalationId}/assist`).then((r) => r.data);

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getChurnRadar = (inactiveDays = 45) =>
  api.get("/admin/churn-radar", { params: { inactive_days: inactiveDays } }).then((r) => r.data);

export const getAgentPerformance = () =>
  api.get("/admin/agent-performance").then((r) => r.data);

// ─── Intelligence ─────────────────────────────────────────────────────────────
export const getBriefing = () => api.get("/intelligence/briefing/today").then((r) => r.data);

export const getBenchmark = () => api.get("/admin/benchmark").then((r) => r.data);

export const getUpcomingSeasons = () =>
  api.get("/admin/seasonal/upcoming").then((r) => r.data);

// ─── Knowledge — مسار الـ API: /kb/documents ─────────────────────────────────
export const getKBDocuments = (status?: string) =>
  api.get("/kb/documents", { params: { ...(status ? { status } : {}) } }).then((r) => r.data);

export const getKnowledgeGaps = () =>
  api.get("/intelligence/knowledge-gaps").then((r) => r.data);

export default api;
