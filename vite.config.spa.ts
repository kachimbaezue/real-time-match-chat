/**
 * Vite config for static SPA build (used for Vercel deployment AND local dev).
 * Uses TanStack Router plugin for file-based routing but NO SSR.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  // Allow eval in dev (Vite HMR + TailwindCSS v4 need it)
  server: {
    headers: {
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://real-time-match-chat.onrender.com wss://real-time-match-chat.onrender.com https://flagcdn.com ws://localhost:* http://localhost:*",
        "media-src 'self'",
      ].join("; "),
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      input: { index: "index.html" },
    },
  },
});
