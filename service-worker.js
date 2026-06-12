const CACHE_NAME = "ccoaching-v2";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./coaching.html",
  "./login.html",
  "./dashboard.html",
  "./admin.html",
  "./offline.html",
  "./style.css",
  "./firebase-config.js",
  "./auth.js",
  "./profile.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
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

self.addEventListener("fetch", (event) => {

  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {

        return caches.match(event.request).then(
          (cached) => cached || caches.match("./offline.html")
        );
      })
  );
});
