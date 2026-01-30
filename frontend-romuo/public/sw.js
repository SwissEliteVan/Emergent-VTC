/* eslint-env serviceworker */
// ==========================================================
// Romuo Service Worker - Strategies de cache avancees
// ==========================================================

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `romuo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `romuo-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `romuo-images-${CACHE_VERSION}`;
const API_CACHE = `romuo-api-${CACHE_VERSION}`;

// Assets critiques a mettre en cache immediatement
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/romuo-icon.svg',
  '/icon-192x192.png'
];

// Taille max des caches
const MAX_DYNAMIC_CACHE = 50;
const MAX_IMAGE_CACHE = 100;
const MAX_API_CACHE = 50;

// TTL pour le cache API (5 minutes)
const API_CACHE_TTL = 5 * 60 * 1000;

// ==========================================================
// INSTALLATION - Precache des assets critiques
// ==========================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installation v' + CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching critical assets');
        // Utiliser addAll avec catch pour ne pas bloquer si un asset manque
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ==========================================================
// ACTIVATION - Nettoyage des anciens caches
// ==========================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation v' + CACHE_VERSION);

  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('romuo-') && !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ==========================================================
// UTILITIES
// ==========================================================

// Limiter la taille d'un cache (FIFO)
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// Verifier si une reponse cachee est expiree
function isCacheExpired(response, maxAge) {
  if (!response) return true;
  const dateHeader = response.headers.get('sw-cached-at');
  if (!dateHeader) return false; // Pas de date = cache valide
  return (Date.now() - parseInt(dateHeader)) > maxAge;
}

// Cloner une response avec timestamp
async function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// ==========================================================
// STRATEGIES DE CACHE
// ==========================================================

// Cache-First - Pour les assets immutables (JS/CSS hashes)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Cache-first fetch failed:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Network-First - Pour le contenu HTML dynamique
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback SPA : retourner index.html
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;

    // Dernier recours : page offline
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;

    return new Response('Offline', { status: 503 });
  }
}

// Stale-While-Revalidate - Pour les images
async function staleWhileRevalidate(request, cacheName = IMAGE_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        trimCache(cacheName, MAX_IMAGE_CACHE);
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Network-First avec TTL - Pour les APIs de geocoding
async function networkFirstWithTTL(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      const timestampedResponse = await addTimestamp(response.clone());
      cache.put(request, timestampedResponse);
      trimCache(API_CACHE, MAX_API_CACHE);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached && !isCacheExpired(cached, API_CACHE_TTL)) {
      console.log('[SW] Serving cached API:', request.url);
      return cached;
    }
    // Cache expire mais mieux que rien offline
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ==========================================================
// FETCH ROUTER
// ==========================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requetes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les extensions de navigateur
  if (!url.protocol.startsWith('http')) return;

  // ----- REQUETES EXTERNES -----

  // APIs de geocoding : network-first avec TTL
  if (url.hostname === 'photon.komoot.io' || url.hostname === 'nominatim.openstreetmap.org') {
    event.respondWith(networkFirstWithTTL(request));
    return;
  }

  // Images externes : stale-while-revalidate
  if (url.hostname.includes('unsplash.com') ||
      url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Fonts Google : cache-first (immuables)
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Autres requetes externes : ignorer
  if (url.origin !== self.location.origin) return;

  // ----- REQUETES LOCALES -----

  // Assets Vite (JS/CSS avec hash) : cache-first
  if (url.pathname.startsWith('/assets/') || /\.[a-f0-9]{8}\.(js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images locales : stale-while-revalidate
  if (/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Manifest et SW : network-first (toujours frais)
  if (url.pathname === '/manifest.json' || url.pathname === '/sw.js') {
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML et navigation : network-first avec fallback offline
  event.respondWith(networkFirst(request));
});

// ==========================================================
// MESSAGES - Communication avec l'app
// ==========================================================
self.addEventListener('message', (event) => {
  const { data } = event;

  if (data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (data === 'clearAllCaches') {
    caches.keys().then((names) => {
      Promise.all(names.map(name => caches.delete(name)));
    });
  }

  // Precacher des URLs specifiques
  if (data?.type === 'PRECACHE') {
    const urls = data.urls || [];
    caches.open(STATIC_CACHE).then((cache) => {
      urls.forEach(url => cache.add(url).catch(() => {}));
    });
  }
});

// ==========================================================
// BACKGROUND SYNC - Pour les reservations offline
// ==========================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-booking') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Recuperer les reservations en attente depuis IndexedDB
  // et les envoyer au serveur
  console.log('[SW] Background sync: bookings');
}

// ==========================================================
// PUSH NOTIFICATIONS
// ==========================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Romuo', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'romuo-notification',
    renotify: true,
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Romuo', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus une fenetre existante si possible
        for (const client of clientList) {
          if (client.url.includes('romuo') && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenetre
        return clients.openWindow(url);
      })
  );
});

console.log('[SW] Romuo Service Worker v' + CACHE_VERSION + ' loaded');
