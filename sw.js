/* Pase de Visita: modo sin conexión. La página se pide primero a la red (para recibir mejoras) y, si no hay señal, sale de la copia guardada. */
const V = "pase-00bf96a2bc", CORE = ["./","index.html","manifest.webmanifest","fonts/fraunces-italic.woff2","fonts/fraunces.woff2","fonts/nunito.woff2","fonts/plex-mono-400.woff2","fonts/plex-mono-500.woff2","fonts/plex-mono-600.woff2","icons/apple-touch-icon.png","icons/favicon-32.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function conTiempo(p, ms) { return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("lento")), ms); p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); }); }
async function pagina() {
  const c = await caches.open(V);
  try { const r = await conTiempo(fetch("index.html", { cache: "no-cache" }), 3500); if (r && r.ok) { c.put("index.html", r.clone()); return r; } } catch (e) { /* sin red: copia guardada */ }
  return (await c.match("index.html")) || (await c.match("./")) || fetch("index.html");
}
async function recurso(req) {
  const c = await caches.open(V), hit = await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const r = await fetch(req); if (r && r.ok) c.put(req, r.clone()); return r;
}
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url); if (u.origin !== self.location.origin) return;
  if (req.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("/index.html")) e.respondWith(pagina());
  else e.respondWith(recurso(req));
});
