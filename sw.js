// Pachaka Lokam — robust offline service worker
// Strategy:
//   - App shell: cache-first (fast, works offline)
//   - Same-origin GET: stale-while-revalidate (instant, refreshes in background)
//   - Navigation requests: cache-first → network → offline fallback to index.html
//   - Cross-origin: network with cache fallback (no failures bubble up)
// Bump CACHE_VERSION whenever shell files change.

const CACHE_VERSION = "pl-v16";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME  = `${CACHE_VERSION}-runtime`;

const SHELL = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "data.js",
  "favourites.js",
  "share.js",
  "backup.js",
  "onboarding.js",
  "manifest.webmanifest",
  "assets/logo.png",
  "privacy-policy.html",
  "offline.html",
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    // addAll fails atomically — fall back to addAll-ignore-failures so a single
    // 404 (e.g. an asset rename) never bricks the install.
    await Promise.all(SHELL.map(async url => {
      try { await cache.add(new Request(url, { cache: "reload" })); }
      catch (err) { console.warn("[SW] precache miss:", url, err); }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) { try { return c.focus(); } catch {} }
    }
    if (self.clients.openWindow) return self.clients.openWindow("./");
  })());
});

// --- Strategy helpers ---
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

async function navigationHandler(req) {
  // 1. Try precached index.html (instant, offline-safe)
  const cached = await caches.match("index.html");
  if (cached) {
    // Refresh in background
    fetch(req).then(res => {
      if (res && res.ok) caches.open(RUNTIME).then(c => c.put("index.html", res.clone())).catch(()=>{});
    }).catch(() => {});
    return cached;
  }
  // 2. Try network
  try { return await fetch(req); } catch {}
  // 3. Last-resort offline page
  const offline = await caches.match("offline.html");
  if (offline) return offline;
  return new Response("<h1>Offline</h1><p>Pachaka Lokam will be back when you reconnect.</p>",
    { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigations → app shell
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(navigationHandler(req));
    return;
  }

  if (sameOrigin) {
    // App shell files: cache-first
    const path = url.pathname.replace(/^\/+/, "");
    const isShell = SHELL.some(s => s.replace(/^\.\//,"") === path || (s === "./" && (path === "" || path === "index.html")));
    if (isShell) { e.respondWith(cacheFirst(req)); return; }
    // Other same-origin assets: stale-while-revalidate
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Cross-origin: try network, fallback to cache, never crash
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(RUNTIME).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then(c => c || new Response("", { status: 504 })))
  );
});

// Allow page to ask SW to skip waiting (for instant updates)
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
