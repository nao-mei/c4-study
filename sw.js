const V = "certcoach-v15";
const FILES = ["./", "index.html", "app.js", "content/gap-i.js", "content/gap-j.js","content/gap-a.js", "content/gap-b.js", "content/gap-c.js", "content/gap-d.js", "content/gap-e.js", "content/gap-f.js", "content/gap-g.js", "content/gap-h.js","icons/icon-maskable-512.png","content/lessons-apps-a.js", "content/lessons-apps-b.js", "content/lessons-models-code-eval.js", "content/lessons-agents-prompt.js", "content/lessons-tools-security.js", "content/why-apps-1.js", "content/why-apps-2.js", "content/why-models-code-eval.js", "content/why-agents-prompt.js", "content/why-tools-security.js", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "content/content.js", "content/questions-apps.js", "content/questions-apps2.js", "content/questions-gaps.js", "content/questions-core.js", "content/questions-scenarios.js", "manifest.webmanifest"];
self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))));
// Network-first so content updates arrive when online; cache is the offline fallback.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(res => {
    const copy = res.clone();
    caches.open(V).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
