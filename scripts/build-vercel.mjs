/**
 * Post-build script: converts dist/client/ → .vercel/output/
 * using the Vercel Build Output API v3 — static SPA mode.
 *
 * TanStack Start's SSR bundle hangs in Vercel's Node runtime (known issue
 * with Nitro beta + async_hooks). Since all data fetching is client-side
 * (useEffect), we don't need SSR. This script produces a pure static SPA:
 *
 *   .vercel/output/
 *     config.json          ← routes: serve static, fallback to /index.html
 *     static/              ← dist/client/** (all assets + index.html shell)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const OUT = path.join(root, ".vercel", "output");
const STATIC = path.join(OUT, "static");
const CLIENT = path.join(root, "dist", "client");

// ── 1. Clean and recreate ────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(STATIC, { recursive: true });

// ── 2. Copy all client assets ─────────────────────────────────────────────────
copyDir(CLIENT, STATIC);

// ── 3. Generate index.html if not already present ────────────────────────────
// TanStack Start doesn't emit an index.html in SSR mode, so we build one
// that bootstraps the client bundle.
const indexPath = path.join(STATIC, "index.html");
if (!fs.existsSync(indexPath)) {
  // Find the hashed entry JS and CSS from the assets folder
  const assets = fs.readdirSync(path.join(STATIC, "assets"));
  const entryJs = assets.find((f) => f.startsWith("index-") && f.endsWith(".js")) ?? "";
  const entryCss = assets.find((f) => f.startsWith("styles-") && f.endsWith(".css")) ?? "";

  const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pulse — Feel the match</title>
    <meta name="description" content="Pulse is an AI-powered second-screen companion that explains what's really happening in a football match in real time." />
    <meta name="theme-color" content="#09090B" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:wght@500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" />
    ${entryCss ? `<link rel="stylesheet" href="/assets/${entryCss}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    <script>
      // TanStack Start SSR bootstrap stub — required even in SPA/no-SSR mode.
      // Without this, the client bundle throws "Invariant failed" at hydrateRoot.
      window.$_TSR = {
        initialized: false,
        buffer: [],
        router: {
          matches: [],
          lastMatchId: "__root__",
          manifest: null,
          dehydratedData: null,
        },
        h: function() {},
        t: new Map(),
      };
    </script>
    <script type="module" src="/assets/${entryJs}"></script>
  </body>
</html>`;

  fs.writeFileSync(indexPath, html);
  console.log(`✅  Generated index.html (entry: ${entryJs}, css: ${entryCss})`);
} else {
  console.log("ℹ️   index.html already exists in dist/client, using as-is");
}

// ── 4. config.json — static SPA routing ──────────────────────────────────────
// Serve hashed assets with immutable cache.
// Serve static files (favicon, images, etc.) directly.
// Everything else → /index.html (SPA fallback).
const config = {
  version: 3,
  routes: [
    // Immutable cache for hashed assets
    {
      src: "^/assets/(.+)$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    // Serve existing static files as-is (favicon, images, robots.txt, etc.)
    { handle: "filesystem" },
    // SPA fallback — all unmatched paths → index.html
    { src: "/(.*)", dest: "/index.html" },
  ],
};

fs.writeFileSync(path.join(OUT, "config.json"), JSON.stringify(config, null, 2));

console.log("✅  .vercel/output/ built successfully (static SPA mode)");

// ── helpers ──────────────────────────────────────────────────────────────────
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
