/**
 * Common database helper functions.
 */

const APP_URL = 'http://localhost:1337';// Change this according to your configuration
const RESTAURANT_LIST_OBJ_STORE = 'restaurantList';
const RESTAURANT_REVIEWS_OBJ_STORE = 'restaurantReviews';
const OUTBOX_OBJ_STORE = 'outbox';

class DBHelper {

  /**
   * @description
   * This function will return URL to fetch restaurant data.
   */
  static get DATABASE_URL() {
    return `${APP_URL}/restaurants`;
  }

  /**
   * @description
   * This function will return URL to fetch restaurant reviews.
   */
  static get REVIEWS_URL() {
    return `${APP_URL}/reviews`;
  }

   /**
   * @description
   * This function will return URL to fetch restaurant reviews by restaurant Id.
   */
  static get REVIEWS_BY_ID_URL() {
    return `${APP_URL}/reviews?restaurant_id=`;
  }

  /**
   * @description
   * This function will create object store name 'restaurantList' inside
   * 'restaurant-reviews' db and stores promise in a dbPromise variable
   */
  static initIDB() {
    this.dbPromise = idb.open('restaurant-reviews', 1, function (upgradeDb) {
      var restaurantListStore = upgradeDb.createObjectStore(RESTAURANT_LIST_OBJ_STORE, {
        keyPath: 'id'
      });
      restaurantListStore.createIndex('ids', 'id');

      var reviewsStore = upgradeDb.createObjectStore(RESTAURANT_REVIEWS_OBJ_STORE, {
        keyPath: 'id' //id would be the primary key for stored object.
      });
      reviewsStore.createIndex('restaurantId', 'restaurant_id');

      var offlineStore = upgradeDb.createObjectStore(OUTBOX_OBJ_STORE, {
        keyPath: 'updatedAt' //updatedAt would be the primary key for stored object.
      });

    });
  }

  /**
   * @description
   * This function will return all the restaurant data from indexedDB.
   */
  static getRestaurantsDataFromIDBCache() {
    return this.dbPromise.then(db => {
      var tx = db.transaction(RESTAURANT_LIST_OBJ_STORE);
      var restaurantListStore = tx.objectStore(RESTAURANT_LIST_OBJ_STORE);
      return restaurantListStore.getAll();
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
          restaurants.forEach(restaurant => {
            DBHelper.saveDataToIDB(restaurant, RESTAURANT_LIST_OBJ_STORE);
          });
          callback(null, restaurants);

        }).catch(error => {
          callback(error, null);
        });
      }
    });
  }

  /**
   * @description This method will save restaurant data to IDB.
   * @param {object} data - object to save.
   * @param {string} storeName - Name of the store to save object into.
   */
  static saveDataToIDB(data, storeName) {

    return this.dbPromise.then(db => {

      if (!db) {
        return;
      }

      let tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.put(data);
      return tx.complete;
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
    let srcSet = `/img/${imageId}-400_small.webp 400w, /img/${imageId}-650_medium.webp 650w, /img/${imageId}-800_large.webp 800w,`;
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

  /**
   * @description
   * This function will return all the reviews for a particular restaurant from indexedDB.
   */
  static getReviewsFromIDBCache(restaurantId) {
    return this.dbPromise.then(db => {
      var tx = db.transaction(RESTAURANT_REVIEWS_OBJ_STORE);
      var reviewsStore = tx.objectStore(RESTAURANT_REVIEWS_OBJ_STORE);
      return reviewsStore.index('restaurantId').getAll(parseInt(restaurantId));
    });
  }

   /**
   * @description
   * Fetch restaurant reviews.
   * @param {function} callback
   */
  static fetchReviews(callback) {
    /**
     * If data is not cached then make a network request.
     */
    fetch(DBHelper.REVIEWS_URL).then(response => {
      //If request is unsuccessfull then throw error.
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      //convert data in response received from server to json.
      return response.json();

    }).then(reviews => {
      reviews.forEach(review => {
        DBHelper.saveDataToIDB(review, RESTAURANT_REVIEWS_OBJ_STORE);
      });
      callback(null, reviews);

    }).catch(error => {
      callback(error, null);
    });
  }

  /**
   * @description
   * Fetch restaurant reviews by id.
   * @param {string} restaurantID
   * @param {function} callback
   */
  /* static fetchReviewsById(restaurantID, callback) {
    // fetch all reviews.
    DBHelper.fetchReviews((error, allReviews) => {
      if (error) {
        callback(error, null);
      } else {
        const reviews = allReviews.filter(r => r.restaurant_id == restaurantID);
        if (reviews) { // Got the restaurant
          callback(null, reviews);
        } else { // Reviews does not exist in the database
          callback('Reviews does not exist', null);
        }
      }
    });
  } */

  /**
   * @description
   * Fetch restaurant reviews by id.
   * @param {string} restaurantID
   * @param {function} callback
   */
  static fetchReviewsById(restaurantID, callback) {

    var self = this;

    DBHelper.getReviewsFromIDBCache(restaurantID).then(reviews => {
      /**
       * Check if reviews are already cached in Indexed DB.
       */
      if (reviews.length > 0) {
        callback(null, reviews);

      } else {
        /**
         * If data is not cached then make a network request.
         */
        fetch(`${DBHelper.REVIEWS_BY_ID_URL}${restaurantID}`).then(response => {
          //If request is unsuccessfull then throw error.
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          //convert data in response received from server to json.
          return response.json();

        }).then(reviews => {
          reviews.forEach(review => {
            DBHelper.saveDataToIDB(review, RESTAURANT_REVIEWS_OBJ_STORE);
          });
          callback(null, reviews);

        }).catch(error => {
          callback(error, null);
        });
      }
    });
  }

  static submitReview(reviewObject) {

    return fetch(DBHelper.REVIEWS_URL, {
      body: JSON.stringify(reviewObject),
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST"

    }).then(response => {
      response.json().then(data => {
        DBHelper.saveDataToIDB(data, RESTAURANT_REVIEWS_OBJ_STORE);
        return data;
      })
      // console.log('error');
    }).catch(error => {
      /**
       * User is offline, add an updatedAt and createdAt
       * property to the review object and store it in the IDB.
			 */
      reviewObject.createdAt = new Date().getTime();
      reviewObject.updatedAt = new Date().getTime();
      DBHelper.saveDataToIDB(reviewObject, OUTBOX_OBJ_STORE);
    });
  }

}

