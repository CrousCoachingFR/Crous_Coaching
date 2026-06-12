// ============================================================
// SERVICE WORKER — C_Coaching PWA
// Cache statique + fallback offline
// ============================================================

const CACHE_NAME = "ccoaching-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/coaching.html",
  "/login.html",
  "/dashboard.html",
  "/admin.html",
  "/assets/css/style.css",
  "/assets/js/firebase-config.js",
  "/assets/js/auth.js",
  "/assets/js/profile.js",
  "/manifest.json",
  "/offline.html"
];

// Installation — mise en cache des assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stratégie Network First avec fallback cache
self.addEventListener("fetch", (event) => {
  // On ne cache pas les requêtes Firebase / externes
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Met à jour le cache avec la réponse fraîche
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Réseau indisponible → cache, sinon page offline
        return caches.match(event.request).then(
          (cached) => cached || caches.match("/offline.html")
        );
      })
  );
});
