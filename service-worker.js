const CACHE_NAME = "the-chatting-live"; 

const ASSETS = [
  "/chatapp/",
  "/chatapp/index.html",
  "/chatapp/profile.html",
  "/chatapp/addfriend.html",
  "/chatapp/chat.html",
  "/chatapp/script.js",
  "/chatapp/profile.js",
  "/chatapp/chat.js",
  "/chatapp/addfriend.js",
  "/chatapp/style1.css",
  "/chatapp/style.css",
  "/chatapp/style2.css",
  "/chatapp/style3.css",
  "/chatapp/background.png",
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



