/**
 * Post-build script: converts dist/ → .vercel/output/
 * using the Vercel Build Output API v3.
 *
 * Structure produced:
 *   .vercel/output/
 *     config.json
 *     static/          ← dist/client/**  (public assets)
 *     functions/
 *       index.func/    ← Edge Function wrapping dist/server/server.js
 *         .vc-config.json
 *         index.js     ← thin wrapper
 *         [copied server chunks]
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const OUT = path.join(root, ".vercel", "output");
const STATIC = path.join(OUT, "static");
const FUNC_DIR = path.join(OUT, "functions", "index.func");

// ── 1. Clean previous output ────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FUNC_DIR, { recursive: true });
fs.mkdirSync(STATIC, { recursive: true });

// ── 2. Copy static assets (dist/client → .vercel/output/static) ─────────────
copyDir(path.join(root, "dist", "client"), STATIC);

// ── 3. Copy server bundle into function dir ──────────────────────────────────
copyDir(path.join(root, "dist", "server"), FUNC_DIR);

// ── 4. Write the Edge Function entry (wraps server.js fetch handler) ─────────
//
//  The compiled server.js exports `export default { fetch(req) {} }`
//  Vercel Edge Functions expect `export default { fetch(req) {} }` too — same API.
//  We just re-export it.
//
fs.writeFileSync(
  path.join(FUNC_DIR, "index.js"),
  `export { default } from "./server.js";\n`
);

// ── 5. .vc-config.json for the function ──────────────────────────────────────
fs.writeFileSync(
  path.join(FUNC_DIR, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "edge",
      entrypoint: "index.js",
    },
    null,
    2
  )
);

// ── 6. Top-level config.json — routes ────────────────────────────────────────
//   • Static assets served directly (immutable cache)
//   • Everything else → SSR edge function
const config = {
  version: 3,
  routes: [
    // Static assets with long-lived cache
    {
      src: "^/assets/(.+)$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    // Let the filesystem serve what it has (images, robots.txt, etc.)
    { handle: "filesystem" },
    // Fallback: all unmatched requests → SSR
    { src: "/(.*)", dest: "/index" },
  ],
};

fs.writeFileSync(path.join(OUT, "config.json"), JSON.stringify(config, null, 2));

console.log("✅  .vercel/output/ built successfully");

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
