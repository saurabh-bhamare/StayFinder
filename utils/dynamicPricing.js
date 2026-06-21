const getWeather = require("./weather");

async function getDynamicPrice(listing) {

  let dynamicPrice = listing.price;

  let priceTag = "Normal Price";

  let weatherData = null;

  try {

    weatherData = await getWeather(listing.location);

    // if weather API fails
    if (!weatherData) {

      return {
        dynamicPrice: listing.price,
        priceTag,
        weatherData
      };
    }

    // 🌧 Rain
    if (weatherData.weather === "Rain") {

      dynamicPrice -= 500;
      priceTag = "Rain Offer ☔";

    }

    // ⛈ Thunderstorm
    else if (weatherData.weather === "Thunderstorm") {

      dynamicPrice -= 800;
      priceTag = "Storm Discount ⛈";

    }

    // ☁ Clouds
    else if (weatherData.weather === "Clouds") {

      dynamicPrice -= 200;
      priceTag = "Cloudy Deal ☁";

    }

    // ☀ Clear
    else if (weatherData.weather === "Clear") {

      dynamicPrice += 1000;
      priceTag = "High Demand ☀";

    }

    // ❄ Cold
    if (weatherData.temp < 15) {

      dynamicPrice += 1500;
      priceTag = "Winter Peak ❄";

    }

    // 🌤 Pleasant
    else if (
      weatherData.temp >= 20 &&
      weatherData.temp <= 30
    ) {

      dynamicPrice += 1200;
      priceTag = "Perfect Weather 🌤";

    }

    // 🔥 Summer
    else if (
      weatherData.temp >= 31 &&
      weatherData.temp <= 36
    ) {

      dynamicPrice += 700;
      priceTag = "Summer Rush 🔥";

    }

    // 🥵 Extreme Heat
    else if (weatherData.temp > 36) {

      dynamicPrice -= 400;
      priceTag = "Hot Weather Deal 🥵";

    }

    // minimum price protection
    if (dynamicPrice < 500) {
      dynamicPrice = 500;
    }

    return {
      dynamicPrice,
      priceTag,
      weatherData
    };

  } catch (err) {

    console.log("Dynamic Pricing Error:", err);

    return {
      dynamicPrice: listing.price,
      priceTag,
      weatherData: null
    };
  }
}

module.exports = getDynamicPrice;