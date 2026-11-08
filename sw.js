/* BFC Safe : service worker. Garde l'application en mémoire pour qu'elle s'ouvre sans réseau.
   Les données (documents, comptes) ne sont jamais mises en cache ici. */
var CACHE = "bfc-shell-v1";
var CDN = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdn.jsdelivr.net/npm/tus-js-client@4.1.0/dist/tus.min.js"
];
var LOCAL = ["./", "index.html", "manifest.json"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(LOCAL.concat(CDN).map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  var isCdn = u.hostname === "cdn.jsdelivr.net";
  var isShell = u.origin === self.location.origin && (r.mode === "navigate" || /\.(html|json|png|js)$/.test(u.pathname) || u.pathname.slice(-1) === "/");
  if (!isCdn && !isShell) return;
  e.respondWith(fetch(r).then(function (resp) {
    if (resp && resp.ok) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
    return resp;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (m) {
      return m || (r.mode === "navigate" ? caches.match("index.html") || caches.match("./") : undefined);
    });
  }));
});
