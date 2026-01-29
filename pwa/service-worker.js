/**
 * EMERGENT VTC - Service Worker
 * Enables offline functionality and caching
 * Version: Resilient (handles missing assets gracefully)
 */

const CACHE_NAME = 'emergent-vtc-v2';

// Critical assets - App won't work without these
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

// Optional assets - Nice to have, but app works without them
const OPTIONAL_ASSETS = [
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

/**
 * Cache a single asset with error handling
 * Returns a resolved promise even on failure (for Promise.allSettled behavior)
 */
async function cacheAsset(cache, url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response);
            console.log('[SW] Cached:', url);
            return { status: 'fulfilled', url };
        } else {
            console.warn('[SW] Failed to fetch (non-ok):', url, response.status);
            return { status: 'rejected', url, reason: `HTTP ${response.status}` };
        }
    } catch (error) {
        console.warn('[SW] Failed to cache:', url, error.message);
        return { status: 'rejected', url, reason: error.message };
    }
}

// Install event - cache assets with resilience
self.addEventListener('install', (event) => {
    console.log('[SW] Install');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                // 1. Cache critical assets first (these MUST succeed)
                console.log('[SW] Caching critical assets...');
                try {
                    await cache.addAll(CRITICAL_ASSETS);
                    console.log('[SW] Critical assets cached successfully');
                } catch (error) {
                    console.error('[SW] Critical asset caching failed:', error);
                    // Still continue - we'll try individual caching as fallback
                    for (const url of CRITICAL_ASSETS) {
                        await cacheAsset(cache, url);
                    }
                }

                // 2. Cache optional assets (icons) - failures are OK
                console.log('[SW] Caching optional assets (icons)...');
                const optionalResults = await Promise.allSettled(
                    OPTIONAL_ASSETS.map(url => cacheAsset(cache, url))
                );

                const succeeded = optionalResults.filter(r => r.status === 'fulfilled').length;
                const failed = optionalResults.filter(r => r.status === 'rejected').length;
                console.log(`[SW] Optional assets: ${succeeded} cached, ${failed} skipped`);

                return true;
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (except for fonts/CDN)
    const url = new URL(event.request.url);
    const isLocal = url.origin === self.location.origin;
    const isAllowedExternal = url.hostname.includes('fonts.googleapis.com') ||
                              url.hostname.includes('fonts.gstatic.com');

    if (!isLocal && !isAllowedExternal) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Don't cache opaque responses (cross-origin without CORS)
                        if (response.type === 'opaque') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the fetched response
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Network failed, try to return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return null;
                    });
            })
    );
});

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    const options = {
        body: event.data ? event.data.text() : 'Nouvelle notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'close', title: 'Fermer' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Emergent VTC', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click');
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(clients.openWindow('/'));
    }
});

// Background sync
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);

    if (event.tag === 'sync-rides') {
        event.waitUntil(syncRides());
    }
});

// Sync rides when back online
async function syncRides() {
    try {
        const pendingRides = await getPendingRides();
        for (const ride of pendingRides) {
            await syncRide(ride);
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Placeholder functions for future implementation
async function getPendingRides() {
    return [];
}

async function syncRide(ride) {
    console.log('[SW] Syncing ride:', ride);
}
