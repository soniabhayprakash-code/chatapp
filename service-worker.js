const CACHE_NAME = "the-chatting-live"; 

const ASSETS = [
  "/chatapp/",
  "/chatapp/index.html",
  "/chatapp/style1.css",
  "/chatapp/script.js",
  "/chatapp/manifest.json",
  "/chatapp/icon-192.png",
  "/chatapp/icon-512.png"
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





