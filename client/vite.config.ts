import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Dev-only proxy: Vite → your API (tRPC, etc.).
 * Default 3000 matches many local stacks; Railway and others often use a different port or URL.
 * Override when running `npm run dev`, e.g.:
 *   API_PROXY_TARGET=http://127.0.0.1:8080 npm run dev
 *   API_PROXY_TARGET=https://your-api.up.railway.app npm run dev
 * Production builds do not use this proxy — the browser calls your deployed API origin.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
