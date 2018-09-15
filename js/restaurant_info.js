let restaurant;
var newMap;

/**
 * Initialize map and indexed db as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.initIDB(); //Initialize indexed db
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;

  const address = document.getElementById('restaurant-address');
  address.tabIndex = 0;

  const iconSpan = document.createElement('span');
  iconSpan.innerHTML = '📌';
  iconSpan.setAttribute('aria-hidden', true);
  address.append(iconSpan);

  const addrSpan = document.createElement('span');
  addrSpan.innerHTML = restaurant.address;
  address.append(addrSpan);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} Restaurant`;
  image.srcset = DBHelper.genResponsiveImgUrlForRestaurant(restaurant);
  image.tabIndex = 0;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.tabIndex = 0;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  // fillReviewsHTML();
  fetchRestaurantReviews();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.tabIndex = 0;
    row.appendChild(day);

    const time = document.createElement('td');
    time.tabIndex = 0;

    const clock = document.createElement('span');
    clock.innerHTML = '🕚';
    clock.setAttribute('aria-hidden', true);
    time.append(clock);

    const opHours = document.createElement('span');
    opHours.innerHTML = operatingHours[key];
    time.append(opHours);

    // time.innerHTML = `🕚 ${operatingHours[key]}`;
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Fetch Restaurant reviews
 */
fetchRestaurantReviews = () => {
  const restaurantID = getParameterByName("id");

  if (!restaurantID) {
    console.error('No restaurant id in URL');
    return;
  }

  DBHelper.fetchReviewsById(restaurantID, (err, reviews) => {

    if (err || !reviews) {
      console.log(`No reviews for restaurant id ${restaurantID}`);
    }

    fillReviewsHTML(reviews);
  });
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = '✎ Reviews';
  title.tabIndex = 0;
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.tabIndex = 0;
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  const header = document.createElement('header');

  name.className = 'user-name'
  name.tabIndex = 0;
  const iconSpan = document.createElement('span');
  iconSpan.innerHTML = '👦';
  iconSpan.setAttribute('aria-hidden', true);
  name.append(iconSpan);

  const nameSpan = document.createElement('span');
  nameSpan.innerHTML = review.name;
  name.append(nameSpan);


  header.appendChild(name);

  const date = document.createElement('p');
  date.className = 'date'
  date.tabIndex = 0;
  const calSpan = document.createElement('span');
  calSpan.innerHTML = '📅';
  calSpan.setAttribute('aria-hidden', true);
  date.append(calSpan);

  const dateSpan = document.createElement('span');
  dateSpan.innerHTML = new Date(review.createdAt).toDateString();
  date.append(dateSpan);

  header.appendChild(date);
  li.appendChild(header);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'rating'
  rating.tabIndex = 0;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = 0;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const reviewForm = document.querySelector('.review-form');
/**
 * Submit review which is entered by user.
 */
reviewForm.addEventListener('submit', event => {
  event.preventDefault();
  const reviewObject = {
    restaurant_id: self.restaurant.id,
    name: reviewForm.querySelector('#name').value,
    rating: reviewForm.querySelector('#rating').value,
    comments: reviewForm.querySelector('#comment').value,
  }

  DBHelper.submitReview(reviewObject).then(data => {
    const reviewList = document.querySelector('#reviews-list');
    reviewObject.createdAt = new Date().getTime();
    reviewObject.updatedAt = new Date().getTime();
    reviewList.appendChild(createReviewHTML(reviewObject));
    reviewForm.reset();
  }).catch(error => console.log(error));
})
