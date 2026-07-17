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
// server.js exports `export default { fetch(req) {} }` (Web Fetch API).
// Vercel Node.js serverless functions receive (req: IncomingMessage, res: ServerResponse).
// We bridge them carefully, handling all edge cases.
//
fs.writeFileSync(
  path.join(FUNC_DIR, "index.js"),
  `
import handler from "./server.js";

export default async function vercelHandler(req, res) {
  try {
    const host =
      (Array.isArray(req.headers["x-forwarded-host"])
        ? req.headers["x-forwarded-host"][0]
        : req.headers["x-forwarded-host"]) ||
      (Array.isArray(req.headers["host"])
        ? req.headers["host"][0]
        : req.headers["host"]) ||
      "localhost";

    const proto =
      (Array.isArray(req.headers["x-forwarded-proto"])
        ? req.headers["x-forwarded-proto"][0]
        : req.headers["x-forwarded-proto"]) || "https";

    const urlStr = \`\${proto}://\${host}\${req.url || "/"}\`;
    let url;
    try { url = new URL(urlStr); }
    catch { url = new URL("https://localhost/"); }

    // Build Headers object — req.headers values can be string | string[] | undefined
    const reqHeaders = new Headers();
    for (const [key, val] of Object.entries(req.headers || {})) {
      if (val === undefined) continue;
      if (Array.isArray(val)) {
        val.forEach(v => reqHeaders.append(key, v));
      } else {
        reqHeaders.set(key, val);
      }
    }

    const init = { method: req.method || "GET", headers: reqHeaders };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const buf = await streamToBuffer(req);
      if (buf.byteLength > 0) {
        init.body = buf;
        init.duplex = "half";
      }
    }

    const webRes = await handler.fetch(new Request(url.toString(), init));

    res.statusCode = webRes.status;

    // Set response headers — avoid setting forbidden headers
    const skip = new Set(["transfer-encoding", "connection", "keep-alive"]);
    webRes.headers.forEach((value, key) => {
      if (!skip.has(key.toLowerCase())) {
        try { res.setHeader(key, value); } catch {}
      }
    });

    const body = await webRes.arrayBuffer();
    res.end(Buffer.from(body));
  } catch (err) {
    console.error("[vercel-handler]", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Internal Server Error");
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
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
    // Immutable cache for hashed assets
    {
      src: "^/assets/(.+)$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    // Serve static files from filesystem first (favicon, images, robots.txt, etc.)
    { handle: "filesystem" },
    // Everything else → SSR function
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
