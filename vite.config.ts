import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// When building on Vercel, use the Vercel Nitro preset so the server
// output lands in .vercel/output (Vercel Build Output API format).
const isVercel = process.env.VERCEL === "1";

export default defineConfig(async () => {
  const extraPlugins = [];

  if (isVercel) {
    const { default: nitro } = await import("nitro/vite");
    extraPlugins.push(nitro({ preset: "vercel" }));
  }

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tanstackStart({
        server: { entry: "server" },
      }),
      react(),
      tailwindcss(),
      ...extraPlugins,
    ],
  };
});
