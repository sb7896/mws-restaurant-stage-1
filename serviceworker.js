// importScripts('js/dbhelper.js');
importScripts('js/idb.js');

var genCache = 'restaurant-general';
var imgCache = 'restaurant-img';

var filesToCache = [
    '/',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/js/idb.js',
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

  if (/\.(png|webp).*$/.test(requestUrl.pathname)) {
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

self.addEventListener('sync', function(event) {
  if (event.tag == 'outbox') {
    event.waitUntil(syncReviews());
  }
});

function syncReviews(){

  return idb.open('restaurant-reviews', 1).then(db => {

    const tx = db.transaction('outbox', 'readwrite');
    const store = tx.objectStore('outbox');
    //Get all reviews saved in outbox
    store.getAll().then(reviews => {
      //Submit offline reviews to server
      reviews.forEach(review => {
        fetch('http://localhost:1337/reviews/', {
          body: JSON.stringify(review),
          headers: {
            'Content-Type': 'application/json'
          },
          method: "POST"

        }).then(response => {
          //Save submitted review to IDB and delete the review from outbox.
          return response.json().then(data => {
            let tx = db.transaction('restaurantReviews', 'readwrite');
            let store = tx.objectStore('restaurantReviews');
            store.put(data).then(function(id){
              let tx = db.transaction('outbox', 'readwrite');
              let store = tx.objectStore('outbox');
              store.delete(data.updatedAt);
              return tx.complete;
            }).catch(function(error){
              console.log('Unable to save data to IDB', error);
            });
            return tx.complete;
          }).catch(error => {
            console.log('Couldn\'t connect to network' , error);
          })
        })
      });
    }).catch(function (error) {
      console.log(error);
    });

  }).catch(function (error) {
    console.log(error);
  });
}