/* Service Worker — Reloj de Acordes
 *
 * Hace que la app funcione sin conexión una vez abierta con internet.
 * Como todo el HTML/CSS/JS/imágenes está incrustado en index.html, solo
 * necesitamos cachear ese archivo (y el manifest/íconos) para offline total.
 *
 * IMPORTANTE: cada vez que actualices index.html, subí también el número de
 * versión de CACHE (v1 -> v2 ...) para que los usuarios reciban la versión
 * nueva en vez de la vieja cacheada.
 */
const CACHE = "reloj-acordes-v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Instalación: guardar los archivos base en el caché.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

// Activación: borrar cachés viejos de versiones anteriores.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: estrategia "network-first" para el HTML (así ves la versión más
// nueva si hay internet), con fallback al caché cuando estás offline.
self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  evento.respondWith(
    fetch(req)
      .then((respuesta) => {
        // Guardar una copia fresca en el caché.
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copia));
        return respuesta;
      })
      .catch(() => {
        // Sin internet: servir desde el caché. Si el recurso exacto no está,
        // caer al index.html (para que la app siempre abra).
        return caches.match(req).then((c) => c || caches.match("./index.html"));
      })
  );
});
