// Función de servidor (Vercel / Netlify-compatible): reenvía el formulario a Make
// sin exponer la URL del webhook en el navegador. La URL vive en MAKE_WEBHOOK_URL.
"use strict";

const MAX_HITS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;
const hits = new Map(); // ip -> marcas de tiempo (límite "best effort" por instancia)

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function clean(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function tooManyRequests(ip, now) {
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [key, times] of hits) {
      if (now - times[times.length - 1] >= WINDOW_MS) hits.delete(key);
    }
  }
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Método no permitido." });

  const webhook = process.env.MAKE_WEBHOOK_URL;
  if (!webhook) return send(res, 500, { ok: false, error: "Servicio no configurado." });

  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || (req.socket && req.socket.remoteAddress) || "desconocida";
  if (tooManyRequests(ip, Date.now())) {
    return send(res, 429, { ok: false, error: "Demasiados envíos. Inténtalo de nuevo en unos minutos." });
  }

  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (_) { data = null; }
  }
  if (!data || typeof data !== "object") return send(res, 400, { ok: false, error: "Datos no válidos." });

  // Campo trampa: los bots lo rellenan, las personas no lo ven.
  if (typeof data.web === "string" && data.web.trim() !== "") return send(res, 200, { ok: true });

  const nombre = clean(data.nombre, 100);
  const telefono = clean(data.telefono, 30);
  const email = clean(data.email, 150);
  const mensaje = clean(data.mensaje, 2000);

  const errors = {};
  if (nombre.length < 2) errors.nombre = "Escribe tu nombre.";
  if (!/^[+\d][\d\s().-]{7,}$/.test(telefono)) errors.telefono = "Escribe un teléfono válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Escribe un email válido.";
  if (mensaje.length < 5) errors.mensaje = "Cuéntanos brevemente qué necesitas.";
  if (Object.keys(errors).length) return send(res, 400, { ok: false, errors });

  const r = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, telefono, email, mensaje }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!r || !r.ok) {
    return send(res, 502, { ok: false, error: "No hemos podido enviar tu solicitud. Inténtalo de nuevo en unos minutos." });
  }
  return send(res, 200, { ok: true });
};
