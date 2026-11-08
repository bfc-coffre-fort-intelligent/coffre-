/* BFC Safe : service worker minimal (aucune mise en cache, aucun risque de pages périmées).
   Il sert uniquement à permettre l'installation de l'application sur l'écran d'accueil. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function () {});
