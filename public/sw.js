const CACHE_NAME = "tyrelink-shell-v3";
const APP_SHELL = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Deliberately do not cache HTML, JavaScript, prototype data or API responses.
// Vercel's immutable asset URLs already provide safe caching for static assets,
// while the app shell and live TyreLink data must always be current.
