const CACHE = "xiangke-static-v2";
const STATIC_ASSETS = ["/manifest.webmanifest", "/icon-192.png"];
const CACHEABLE_DESTINATIONS = new Set(["font", "image", "manifest", "script", "style"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/api/")) return;

  // Next.js must receive real failures for page and RSC requests so its
  // offline retry logic can resume the navigation when connectivity returns.
  const isFrameworkNavigation =
    event.request.mode === "navigate" ||
    event.request.headers.has("RSC") ||
    event.request.headers.has("Next-Router-Prefetch") ||
    requestUrl.searchParams.has("_rsc");
  if (isFrameworkNavigation || !CACHEABLE_DESTINATIONS.has(event.request.destination)) return;

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
    if (response.ok) event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, response.clone())));
    return response;
  })));
});
