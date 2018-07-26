/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * @description
   * This function will return URL to fetch restaurant data.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * @description
   * This function will create object store name 'restaurants' inside
   * 'restaurant-reviews' db and stores promise in a dbPromise variable
   */
  static initIDB() {
    this.dbPromise = idb.open('restaurant-reviews', 1, function (upgradeDb) {
      var reviewsStore = upgradeDb.createObjectStore('restaurantReviews', {
        keyPath: 'id'
      });
      reviewsStore.createIndex('ids', 'id');
    });
  }

  /**
   * @description
   * This function will return all the restaurant data from indexedDB.
   */
  static getRestaurantsDataFromIDBCache() {
    return this.dbPromise.then(db => {
      var tx = db.transaction('restaurantReviews');
      var reviewsStore = tx.objectStore('restaurantReviews');
      return reviewsStore.getAll();
    })
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    var self = this;

    DBHelper.getRestaurantsDataFromIDBCache().then(restaurants => {
      /**
       * Check if restaurant data is already cached in Indexed DB.
       */
      if (restaurants.length > 0) {
        callback(null, restaurants);

      } else {
        /**
         * If data is not cached then make a network request.
         */
        fetch(DBHelper.DATABASE_URL).then(response => {
          //If request is unsuccessfull then throw error.
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          //convert data in response received from server to json.
          return response.json();

        }).then(restaurants => {
          //processing the json data sent from the previous callback function.
          DBHelper.addRestaurantsToIDB(restaurants);
          callback(null, restaurants);

        }).catch(error => {
          callback(error, null);
        });
      }
    });
    }

    /**
     * @description This method will add restaurant data to IDB
     * @param {string} restaurants - Array of restaurants
     */
    static addRestaurantsToIDB (restaurants) {
      var self = this;
      restaurants.forEach(restaurant => {
        self.dbPromise.then(db => {
          var tx = db.transaction('restaurantReviews', 'readwrite');
          var reviewsStore = tx.objectStore('restaurantReviews');
          reviewsStore.put(restaurant);
          return tx.complete;
        });
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants((error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          const restaurant = restaurants.find(r => r.id == id);
          if (restaurant) { // Got the restaurant
            callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Generate responsive image url for srcSet.
   */
  static genResponsiveImgUrlForRestaurant(restaurant) {
    let imageId = restaurant.photograph;
    let srcSet = `/img/${imageId}-400_small.jpg 400w, /img/${imageId}-650_medium.jpg 650w, /img/${imageId}-800_large.jpg 800w,`;
    return srcSet;
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

}

