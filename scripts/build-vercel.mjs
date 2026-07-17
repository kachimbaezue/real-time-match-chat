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

// ── 4. Write the Node.js serverless function entry ───────────────────────────
//
// The compiled server.js exports `export default { fetch(req) {} }` (Web Fetch API).
// Vercel Node.js functions receive (req, res) — we bridge them here.
//
fs.writeFileSync(
  path.join(FUNC_DIR, "index.js"),
  `
import handler from "./server.js";

export default async function vercelHandler(req, res) {
  // Build a Web API Request from the Vercel IncomingMessage
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url, \`\${proto}://\${host}\`);

  const init = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await streamToBuffer(req);
    init.duplex = "half";
  }

  const webReq = new Request(url.toString(), init);
  const webRes = await handler.fetch(webReq);

  res.statusCode = webRes.status;
  for (const [key, value] of webRes.headers.entries()) {
    res.setHeader(key, value);
  }

  const body = await webRes.arrayBuffer();
  res.end(Buffer.from(body));
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
`.trimStart()
);

// ── 5. .vc-config.json for the function ──────────────────────────────────────
// Must use nodejs runtime — the SSR bundle imports react, socket.io-client, etc.
// which are not available in the Edge runtime.
fs.writeFileSync(
  path.join(FUNC_DIR, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
    },
    null,
    2
  )
);

// Mark the function dir as ESM so Node resolves `import` statements correctly
fs.writeFileSync(
  path.join(FUNC_DIR, "package.json"),
  JSON.stringify({ type: "module" }, null, 2)
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
    // Let the filesystem serve what it has (images, favicon, robots.txt, etc.)
    { handle: "filesystem" },
    // Explicitly catch common static file extensions — never SSR these
    {
      src: "^/.+\\.(ico|png|jpg|jpeg|svg|gif|webp|mp4|webm|woff2?|ttf|otf|txt|xml|json)$",
      status: 404,
    },
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
