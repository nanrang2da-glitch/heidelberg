// 오프라인용 서비스 워커 — 버전: 20261116-143233
const CACHE = "hc-map-20261116-143233";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // 페이지: 인터넷이 되면 최신 버전, 안 되면(또는 3초 넘게 걸리면) 저장된 버전
  if (req.mode === "navigate") {
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); }
      return res;
    });
    const timeout = new Promise(r => setTimeout(r, 3000)).then(() => caches.match("index.html"));
    e.respondWith(Promise.race([net.catch(() => caches.match("index.html")), timeout])
      .then(res => res || net));
    return;
  }
  // 아이콘·글꼴 등: 저장된 것을 먼저 쓰고 뒤에서 새로 받아 둠
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
