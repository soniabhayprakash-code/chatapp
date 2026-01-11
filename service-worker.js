const CACHE_NAME = "the-chatting-live"; 

const ASSETS = [
  "/chattingplatform/",
  "/chattingplatform/index.html",
  "/chattingplatform/style.css",
  "/chattingplatform/script.js",
  "/chattingplatform/manifest.json",
  "/chattingplatform/icon-192.png",
  "/chattingplatform/icon-512.png"
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});