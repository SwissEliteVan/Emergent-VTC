const CACHE_VERSION = 'v2';
const STATIC_CACHE = `romuo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `romuo-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `romuo-images-${CACHE_VERSION}`;

// Ressources critiques a pre-cacher
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/romuo-icon.svg'
];

// Taille max du cache dynamique (en nombre d'entrees)
const MAX_DYNAMIC_CACHE = 50;
const MAX_IMAGE_CACHE = 30;

// Installation : pre-cache des ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('romuo-') &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== IMAGE_CACHE;
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Limiter la taille d'un cache
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    });
  });
}

// Strategie : Cache-First pour les assets hashes (JS, CSS avec hash Vite)
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

// Strategie : Network-First pour le HTML et API
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clone);
          trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE);
        });
      }
      return response;
    })
    .catch(() => {
      return caches.match(request).then((cached) => {
        return cached || caches.match('/index.html');
      });
    });
}

// Strategie : Stale-While-Revalidate pour les images
function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(IMAGE_CACHE).then((cache) => {
          cache.put(request, clone);
          trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
        });
      }
      return response;
    }).catch(() => cached);

    return cached || fetchPromise;
  });
}

// Router : choisir la strategie selon le type de requete
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requetes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requetes vers d'autres origines (sauf images et tiles)
  if (url.origin !== self.location.origin) {
    // Images Unsplash et tiles OpenStreetMap : stale-while-revalidate
    if (url.hostname.includes('unsplash.com') ||
        url.hostname.includes('tile.openstreetmap.org')) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  // Assets hashes par Vite (immutables) : cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images locales : stale-while-revalidate
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // HTML et tout le reste : network-first
  event.respondWith(networkFirst(request));
});
