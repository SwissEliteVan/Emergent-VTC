/**
 * Romuo.ch - Service Worker
 * Enables offline functionality and caching
 * Version: Resilient (handles missing assets gracefully)
 */

const CACHE_NAME = 'romuo-vtc-v2';

// Critical assets - App won't work without these
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
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
    '/icons/icon-512x512.png',
    '/icons/icon.svg'
];

/**
 * Cache a single asset with error handling
 * Returns a resolved promise even on failure
 */
async function cacheAsset(cache, url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response);
            console.log('[SW] Cached:', url);
            return { status: 'fulfilled', url };
        } else {
            console.warn('[SW] Failed to fetch:', url, response.status);
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
                    // Fallback: try caching individually
                    for (const url of CRITICAL_ASSETS) {
                        await cacheAsset(cache, url);
                    }
                }

                // 2. Cache optional assets (icons) - failures are OK
                console.log('[SW] Caching optional assets...');
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

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Allow external CDN resources
    const url = new URL(event.request.url);
    const isLocal = url.origin === self.location.origin;
    const isAllowedCDN =
        url.hostname.includes('cdn.tailwindcss.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('unpkg.com');

    if (!isLocal && !isAllowedCDN) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response && response.status === 200) {
                    // Only cache same-origin and basic responses
                    if (response.type === 'basic' || isLocal) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseClone));
                    }
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return main page for navigation
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
            dateOfArrival: Date.now()
        },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'close', title: 'Fermer' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Romuo.ch', options)
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
