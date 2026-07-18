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
// Use dist/spa (SPA build via vite.config.spa.ts) if it exists, else fall back to dist/client
const spaDir = path.join(root, "dist", "spa");
const CLIENT = fs.existsSync(spaDir) ? spaDir : path.join(root, "dist", "client");

// ── 1. Clean and recreate ────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(STATIC, { recursive: true });

// ── 2. Copy all client assets ─────────────────────────────────────────────────
copyDir(CLIENT, STATIC);

// ── 3. Patch all JS bundles ───────────────────────────────────────────────────
// Fix env vars that may have compiled as empty strings, and patch hydrateRoot.
const RENDER_URL = "https://real-time-match-chat.onrender.com";
const assetsDir = path.join(STATIC, "assets");
const allAssets = fs.readdirSync(assetsDir);

for (const file of allAssets) {
  if (!file.endsWith(".js")) continue;
  const filePath = path.join(assetsDir, file);
  let src = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // Fix empty VITE_SOCKET_URL (compiled as empty string var r=``)
  // Pattern: var r=``; followed by socket connection code (i=null, async function a())
  if (/var r=``,i=null/.test(src) || (/var r=``/.test(src) && src.includes("reconnectionDelay"))) {
    src = src.replace(/var r=``/, `var r="${RENDER_URL}"`);
    changed = true;
    console.log(`✅  Patched socket URL in ${file}`);
  }

  // Fix empty VITE_API_URL — compiled as empty backtick string before fetch calls
  // Pattern: var y=``; (or similar var name) right before fetch('/matches/live')
  if (/var [a-z]=``,/.test(src) && src.includes("/matches/live")) {
    src = src.replace(/var ([a-z])=``;(async function)/, (m, varName, rest) => {
      return `var ${varName}="${RENDER_URL}";${rest}`;
    });
    // Also try simpler pattern
    src = src.replace(/(var [a-z]=``)(`\$\{[a-z]\}\/matches)/, (m, urlVar, pathPart) => {
      return `${urlVar.replace("``", `"${RENDER_URL}"`)}${pathPart}`;
    });
    // Most reliable: find the exact empty string var right before fetch usage
    src = src.replace(/var ([a-z])=``([\s\S]{0,50}?async function [a-z]\(e\)\{let [a-z]=new AbortController)/, (m, varName, middle) => {
      return `var ${varName}="${RENDER_URL}"${middle}`;
    });
    changed = true;
    console.log(`✅  Patched API URL in ${file}`);
  }

  // NOTE: No hydrateRoot patching needed — SPA build via vite.config.spa.ts
  // uses @vitejs/plugin-react + entry-client.tsx which calls createRoot directly.

  if (changed) {
    fs.writeFileSync(filePath, src);
  }
}

// ── 4. Patch index.html ───────────────────────────────────────────────────────
// The SPA build produces its own index.html — just make sure the URLs are right.
const indexPath = path.join(STATIC, "index.html");
if (fs.existsSync(indexPath)) {
  console.log("ℹ️   index.html exists from SPA build, using as-is");
} else {
  // Fallback: generate one manually
  const entryJs = allAssets.find((f) => f.startsWith("index-") && f.endsWith(".js")) ?? "";
  const entryCss = allAssets.find((f) => f.startsWith("styles-") && f.endsWith(".css")) ?? "";

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
    <script type="module" src="/assets/${entryJs}"></script>
  </body>
</html>`;

  fs.writeFileSync(indexPath, html);
  console.log(`✅  Generated fallback index.html (entry: ${entryJs})`);
}

// ── 5. config.json — static SPA routing ──────────────────────────────────────
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
