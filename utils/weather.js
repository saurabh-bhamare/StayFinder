const axios = require("axios");

const API_KEY = process.env.WEATHER_API_KEY;

async function getWeather(city) {
    try {

        if (!city || city.trim() === "") {
            return null;
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city.trim()}&appid=${API_KEY}&units=metric`;

        const response = await axios.get(url);

        return {
            temp: response.data.main.temp,
            weather: response.data.weather[0].main,
        };

    } catch (err) {

        console.log("Weather API Error:", err.response?.data || err.message);

        return null;
    }
}

module.exports = getWeather;