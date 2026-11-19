/* Materu service worker: app-shell offline support */
const CACHE = "materu-v1";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/brand/logo-symbol.svg",
  "/brand/materu-app-icon-192.png",
  "/brand/materu-app-icon-512.png",
  "/img/ember.webp",
  "/img/graphite.webp",
  "/img/glacier.webp",
  "/img/ruby.webp",
  "/img/rosewood.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // pages: network first, fall back to cache (works offline)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((m) => m || caches.match("/")))
    );
    return;
  }

  // static assets & images: cache first, fill cache on miss
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/img/") ||
    url.pathname.startsWith("/brand/")
  ) {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
  }
});
