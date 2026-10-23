// سرویس‌ورکر هنگویه اسپورت: ابتدا شبکه (تا به‌روزرسانی‌ها فوراً دیده شوند)، در نبود اینترنت نسخه‌ی ذخیره‌شده
const CACHE = "hongooye-v4";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return;
  e.respondWith(fetch(r).then(res => { if(res && res.ok && new URL(r.url).origin === location.origin){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("./index.html") || caches.match("./") : undefined))));
});
