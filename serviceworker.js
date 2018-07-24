var genCache = 'restaurant-general';
var imgCache = 'restaurant-img';

var filesToCache = [
    '/',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/data/restaurants.json',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
];

/**
 * This block is invoked when install event is fired
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(genCache).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/**
 * This block is invoked when activate event is fired
 */
self.addEventListener('activate', function(event) {
    console.log('Service Worker Activated');
    event.waitUntil(self.clients.claim());
});

/**
 * This block is invoked when fetch event is fired
 */
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (/\.(jpe?g|png).*$/.test(requestUrl.pathname)) {
     event.respondWith(cachePhotos(event.request));
     return;
  }

  /**
   * Check if the resource is available in the cache, if it is
   * then took it from the cache otherwise fetch it from the network
   */
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

/**
* @description Adds photos to the imgCache
* @param {string} request
* @returns {Response}
*/
function cachePhotos(request) {
  var storageUrl = new URL(request.url).pathname;

  return caches.open(imgCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}