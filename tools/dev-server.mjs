// Solo para desarrollo local (no se sube). Sirve la carpeta como un hosting estático
// y ejecuta api/lead.js igual que lo haría Vercel. Uso: node tools/dev-server.mjs [puerto]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const port = Number(process.argv[2]) || 4322;

for (const envPath of [path.join(root, ".env"), path.join(root, "..", ".env")]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  break;
}

const lead = require(path.join(root, "api", "lead.js"));
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".woff2": "font/woff2", ".txt": "text/plain", ".ico": "image/x-icon",
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/lead") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = null; }
    return lead(req, res);
  }
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root) || /[\\/]\.|[\\/](api|tools)[\\/]|\.md$/i.test(file.slice(root.length))) {
    res.statusCode = 404; return res.end("No encontrado");
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("No encontrado"); }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-cache");
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`RevLeads v2 en http://localhost:${port}`));
