"use strict";

const CACHE = "tre-app-cloud-v1";

const PRECACHE = [
  "/",
  "/index.html",
  "/static/style.css",
  "/static/app.js",
  "/static/api.js",
  "/static/config.js",
  "/static/exercises.js",
  "/static/manifest.webmanifest",
  "/static/icon-192.png",
  "/static/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for navigation and static assets; falls back to cache offline.
// API calls (journal data) are network-only so local data stays fresh.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls - always hit the network.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Cross-origin (e.g. YouTube) - pass through untouched.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && event.request.method === "GET") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("/"))
      )
  );
});
