const searchInput = document.querySelector(".search-input");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeatherDiv = document.querySelector(
  ".hourly-weather .weather-list"
);

// API key from Weather API
const API_KEY = "1f28eb3d551f4f84bfe132518252003";

// Weather codes for mapping to custom icons
const weatherCodes = {
  clear: [1000],
  clouds: [1003, 1006, 1009],
  mist: [1030, 1135, 1147],
  rain: [
    1063, 1150, 1153, 1168, 1171, 1180, 1183, 1198, 1201, 1240, 1243, 1246,
    1273, 1276,
  ],
  moderate_heavy_rain: [1186, 1189, 1192, 1195, 1243, 1246],
  snow: [
    1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222,
    1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282,
  ],
  thunder: [1087, 1279, 1282],
  thunder_rain: [1273, 1276],
};
const displayHourlyForecast = (hourlyData) => {
  const now = new Date();
  const currentTime = now.getTime();

  // Filter hours that are in the future (including current hour)
  let futureHours = hourlyData.filter((item) => {
    const itemTime = new Date(item.time).getTime();
    return itemTime >= currentTime;
  });

  // If we don't have 24 future hours, add hours from the next day
  if (futureHours.length < 24) {
    const remainingHours = 24 - futureHours.length;
    futureHours = futureHours.concat(hourlyData.slice(0, remainingHours));
  }

  // Take exactly 24 hours
  const next24Hours = futureHours.slice(0, 24);

  hourlyWeatherDiv.innerHTML = next24Hours
    .map((item) => {
      const temperature = Math.floor(item.temp_c);
      const time = new Date(item.time);

      // Format time as "HH:MM PM/AM" (e.g., "07:00 PM")
      const timeFormatted = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const weatherIcon = Object.keys(weatherCodes).find((icon) =>
        weatherCodes[icon].includes(item.condition.code)
      );

      return `<li class="weather-item">
                <p class="time">${timeFormatted}</p>
                <img src="icons/${weatherIcon}.svg" class="weather-icon" />
                <p class="temperature">${temperature}&deg;</p>
              </li>`;
    })
    .join("");
};

// Auto-update every hour
setInterval(() => {
  const cityName = searchInput.value.trim();
  if (cityName) {
    setupWeatherRequest(cityName);
  }
}, 60 * 60 * 1000); // Refresh every hour

const getWeatherDetails = async (API_URL) => {
  window.innerWidth <= 768 && searchInput.blur();
  document.body.classList.remove("show-no-results");
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    // Extract current weather deatils
    const temperature = Math.floor(data.current.temp_c);
    const description = data.current.condition.text;
    const weatherIcon = Object.keys(weatherCodes).find((icon) =>
      weatherCodes[icon].includes(data.current.condition.code)
    );
    console.log(data);
    // to update the current weather
    currentWeatherDiv.querySelector(
      ".weather-icon"
    ).src = `icons/${weatherIcon}.svg`;
    currentWeatherDiv.querySelector(
      ".temperature"
    ).innerHTML = `${temperature}<span>&deg;C</span>`;
    currentWeatherDiv.querySelector(".description").innerHTML = description;

    const combinedHourlyData = [
      ...(data.forecast?.forecastday?.[0]?.hour || []),
      ...(data.forecast?.forecastday?.[1]?.hour || []),
    ];
    displayHourlyForecast(combinedHourlyData);
    searchInput.value = data.location.name;
  } catch (error) {
    document.body.classList.add("show-no-results");
    hourlyWeatherDiv.innerHTML = ""; // Clear previous hourly forecast
  }
};
const setupWeatherRequest = (cityName) => {
  const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=2&aqi=no&alerts=no`;
  getWeatherDetails(API_URL);
};
// Handle user input in the search box
searchInput.addEventListener("keyup", (e) => {
  const cityName = searchInput.value.trim();
  if (e.key == "Enter" && cityName) {
    setupWeatherRequest(cityName);
  }
});

locationButton.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      if (accuracy > 5000) {
        // If accuracy is too low, alert the user
        alert("Your location accuracy is low. Try moving to an open area.");
      }
      const API_URL = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}`;
      getWeatherDetails(API_URL);
    },
    (error) => {
      alert(
        "Location access denied. Please enable permission to use this feature."
      );
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Ensure high accuracy
  );
});
