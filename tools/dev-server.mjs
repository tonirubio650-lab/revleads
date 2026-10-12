// Solo para desarrollo local (no se sube). Sirve la web como un hosting estático
// y ejecuta api/lead.js igual que lo haría Vercel. Uso: node tools/dev-server.mjs [puerto]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const port = Number(process.argv[2]) || 4322;
const MAX_BODY = 64 * 1024;

// Variables de entorno desde .env (la URL del webhook de Make no está en el código)
const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const lead = require(path.join(root, "api", "lead.js"));
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".txt": "text/plain",
};

// Lista blanca: solo se publica lo que la web necesita. Todo lo demás es 404.
const PUBLIC_FILES = new Set(["index.html", "styles.css", "main.js", "robots.txt"]);
const PUBLIC_DIRS = /^(lib|assets)\//;

function notFound(res) { res.statusCode = 404; res.end("No encontrado"); }

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/lead") {
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > MAX_BODY) { res.statusCode = 413; return res.end("Demasiado grande"); }
      chunks.push(c);
    }
    try { req.body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { req.body = null; }
    return lead(req, res);
  }

  let rel;
  try { rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html"; } catch { return notFound(res); }
  if (rel.includes("..") || !(PUBLIC_FILES.has(rel) || PUBLIC_DIRS.test(rel))) return notFound(res);

  const file = path.join(root, rel);
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    pipeline(fs.createReadStream(file), res, () => {});
  });
}).listen(port, () => console.log(`RevLeads en http://localhost:${port}`));
