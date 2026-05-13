const CACHE_NAME = "dua-reader-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon.svg"];
const PAGE_CACHE = "dua-reader-pages-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/index.html")));
    return;
  }

  if (url.pathname.startsWith("/pages/")) {
    event.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
