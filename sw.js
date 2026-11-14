/* BFC Safe : service worker v3. L'application s'ouvre tout de suite depuis la mémoire du téléphone,
   puis se met à jour en arrière-plan quand le réseau répond. Les données (documents, comptes) ne sont jamais mises en cache ici. */
var CACHE = "bfc-shell-v3";
var CDN = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://cdn.jsdelivr.net/npm/tus-js-client@4.1.0/dist/tus.min.js"
];
var LOCAL = ["./", "index.html", "accueil.html", "manifest.json", "bfc-icone-192.png", "symbole-fond-vert.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(LOCAL.concat(CDN).map(function (u) { return fetch(new Request(u, { cache: "reload" })).then(function (resp) { if (resp && resp.ok) return c.put(u, resp); }).catch(function () {}); }));
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
  var isShell = u.origin === self.location.origin && (r.mode === "navigate" || /\.(html|json|png|js|svg|jpg)$/.test(u.pathname) || u.pathname.slice(-1) === "/");
  if (!isCdn && !isShell) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(r, { cache: "no-cache" }).then(function (resp) {
        if (resp && resp.ok) c.put(r, resp.clone());
        return resp;
      }).catch(function () { return null; });
      if (hit) { e.waitUntil(net); return hit; }
      return net.then(function (resp) {
        if (resp) return resp;
        if (r.mode === "navigate") return c.match("index.html") || c.match("./");
        return Response.error();
      });
    });
  }));
});
