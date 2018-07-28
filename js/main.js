let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Initialize Map, fetch neighborhoods, cuisines as soon as the page is loaded
 * and also register the Service Worker.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.initIDB(); //Initialize indexed db
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
  // lazyLoadCSS();
  lazyLoadImages(); //Fetch image upon scrolling.
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoic3dhcG5pbGJhbmdhcmUiLCJhIjoiY2ppcjl3NWhzMTQ4cDN3cGViZnFzdHR6cSJ9.CqEDbAYmvH7EqM0jv47BWg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = '/img/placeholder.webp';
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.srcset = DBHelper.genResponsiveImgUrlForRestaurant(restaurant);
  image.alt = `Image of ${restaurant.name} Restaurant`;
  // image.srcset = DBHelper.genResponsiveImgUrlForRestaurant(restaurant);
  image.tabIndex = 0;
  window.lazyImageObserver.observe(image);
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;
  li.append(name);

  const neighborhoodDiv = document.createElement('div');

  const neighborhoodP = document.createElement('p');
  neighborhoodP.innerHTML = '🏠';
  neighborhoodDiv.append(neighborhoodP);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.tabIndex = 0;
  neighborhoodDiv.append(neighborhood);
  li.append(neighborhoodDiv);

  const addressDiv = document.createElement('div');

  const addressP = document.createElement('p');
  addressP.innerHTML = '📌';
  addressDiv.append(addressP);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.tabIndex = 0;
  addressDiv.append(address);
  li.append(addressDiv);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

};

/**
* @description
  This method uses Service Worker API and registers it to make our app work offline.
*/
registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js', { scope: '/' })
      .then(function (registration) {
        console.log('Service Worker Registered');
      }, function (err) {
        console.log('Service Worker registration failed');
      });

    navigator.serviceWorker.ready.then(function (registration) {
      console.log('Service Worker Ready');
    });
  }
};

/* createLinkTag = (filename) => {
  var linkTag = document.createElement('link');
  linkTag.rel = 'stylesheet';
  linkTag.href = filename;
  var headTag = document.getElementsByTagName('head')[0];
  headTag.parentNode.insertBefore(linkTag, headTag);
} */

/* function loadCSS() {
  createLinkTag('//normalize-css.googlecode.com/svn/trunk/normalize.css');
  createLinkTag('css/styles.css');
  createLinkTag('https://unpkg.com/leaflet@1.3.1/dist/leaflet.css');
} */

/* lazyLoadCSS = () =>{
  window.addEventListener('load', loadCSS);
}; */

/**
* @description
  This method will fetch images as user scrolls down.
*/
lazyLoadImages = () => {
  if ("IntersectionObserver" in window) {
    window.lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        //If portion of the image comes under viewport then fetch it.
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
  }
};
