/**
 * HamroHisab Service Worker
 *
 * Safety contract for a multi-tenant SaaS application:
 *
 *  CACHED  — Next.js content-hashed static bundles (/_next/static/**)
 *            These are immutable by design: the hash changes on every deploy.
 *            Safe to serve from cache; a new deploy invalidates them automatically.
 *
 *  CACHED  — App shell: /offline.html only.
 *
 *  NEVER   — *.supabase.co  (auth, RLS-gated data, realtime)
 *  NEVER   — /_next/data/** (server-rendered RSC payloads — may contain tenant data)
 *  NEVER   — /api/**        (internal API routes)
 *  NEVER   — /auth/**       (login / token refresh flows)
 *  NEVER   — page HTML for authenticated routes (/admin, /operator, /superadmin)
 *
 * When offline, authenticated navigation returns the offline page.
 * API and Supabase requests return a structured 503 JSON.
 */

const CACHE_NAME = "hamrohisab-shell-v1";
const OFFLINE_URL = "/offline.html";

// Patterns that must NEVER be served from cache under any circumstances.
const NETWORK_ONLY_PATTERNS = [
  /\.supabase\.co/,
  /\/_next\/data\//,
  /\/api\//,
  /\/auth\//,
];

// Static asset patterns safe to cache (all are content-hashed by Next.js).
const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\//,
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept http/https requests.
  if (!url.protocol.startsWith("http")) return;

  // 1. Network-only: Supabase, RSC data, API, auth — never cache, offline = 503.
  if (NETWORK_ONLY_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(networkOnlyWithOfflineFallback(request));
    return;
  }

  // 2. Cache-first: Next.js content-hashed static bundles.
  if (STATIC_ASSET_PATTERNS.some((p) => p.test(url.href))) {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  // 3. Navigation requests — network-first, offline page on failure.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // 4. Everything else (images, fonts from same origin, etc.) — network only.
  // No fallback; let the browser surface the natural error.
  event.respondWith(fetch(request));
});

// ─── Strategies ──────────────────────────────────────────────────────────────

async function networkOnlyWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    if (request.mode === "navigate") {
      const cached = await caches.match(OFFLINE_URL);
      return cached ?? offlineResponse();
    }
    return offlineJsonResponse();
  }
}

async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(OFFLINE_URL);
    return cached ?? offlineResponse();
  }
}

function offlineJsonResponse() {
  return new Response(
    JSON.stringify({ error: "offline", message: "You are currently offline." }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    }
  );
}

function offlineResponse() {
  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  });
}
