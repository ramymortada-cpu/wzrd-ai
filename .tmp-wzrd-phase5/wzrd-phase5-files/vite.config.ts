import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const clientRoot = path.resolve(import.meta.dirname, "client");
const outDir = path.resolve(import.meta.dirname, "dist/public");

export default defineConfig({
  base: process.env.VITE_BASE_URL || "/",
  root: clientRoot,
  define: {
    "import.meta.env.VITE_APP_URL": JSON.stringify(
      process.env.APP_URL || "http://localhost:3000"
    ),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.join(clientRoot, "src"),
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
