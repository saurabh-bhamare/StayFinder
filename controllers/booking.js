const Booking = require("../models/booking");
const Listing = require("../models/listing");
const getWeather = require("../utils/weather");

module.exports.createBooking = async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.body;

    // 1. Basic validation
    if (!checkIn || !checkOut) {
      return res.status(400).send("Dates are required");
    }

    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    const today = new Date();

    if (ci >= co) {
      return res.status(400).send("Invalid date range");
    }

    today.setHours(0,0,0,0);

if (ci < today) {
      return res.status(400).send("Past dates not allowed");
    }

    // 2. Get listing
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    // 3. Guest validation
    if (guests < 1 || guests > 10) {
      return res.status(400).send("Invalid number of guests");
    }

    // 4. Check availability (OVERLAP CHECK)
    const conflict = await Booking.findOne({
      listing: listing._id,
      checkIn: { $lt: co },
      checkOut: { $gt: ci }
    });

    if (conflict) {
      return res.status(400).send("Dates not available");
    }

    // 5. Price calculation (SERVER SIDE)
    // ======================================================
// 🌦 WEATHER DYNAMIC PRICING
// ======================================================

let dynamicPrice = listing.price;

try {

  const weatherData = await getWeather(listing.location);

  if (weatherData) {

    // 🌧 Rain
    if (weatherData.weather === "Rain") {
      dynamicPrice -= 500;
    }

    // ⛈ Thunderstorm
    else if (weatherData.weather === "Thunderstorm") {
      dynamicPrice -= 800;
    }

    // ☁ Clouds
    else if (weatherData.weather === "Clouds") {
      dynamicPrice -= 200;
    }

    // ☀ Clear
    else if (weatherData.weather === "Clear") {
      dynamicPrice += 1000;
    }

    // ❄ Winter
    if (weatherData.temp < 15) {
      dynamicPrice += 1500;
    }

    // 🌤 Pleasant
    else if (
      weatherData.temp >= 20 &&
      weatherData.temp <= 30
    ) {
      dynamicPrice += 1200;
    }

    // 🔥 Summer
    else if (
      weatherData.temp >= 31 &&
      weatherData.temp <= 36
    ) {
      dynamicPrice += 700;
    }

    // 🥵 Extreme Heat
    else if (weatherData.temp > 36) {
      dynamicPrice -= 400;
    }
  }

} catch (err) {

  console.log("Booking Weather Error:", err);
}

// minimum protection
if (dynamicPrice < 500) {
  dynamicPrice = 500;
}

// ======================================================
// 💰 FINAL BOOKING PRICE
// ======================================================

const nights = Math.ceil(
  (co - ci) / (1000 * 60 * 60 * 24)
);

const base = nights * dynamicPrice;

const total = base + 1200 + 800;

    // 6. Create booking
    const newBooking = new Booking({
      listing: listing._id,
      user: req.user._id, // if using auth
      checkIn: ci,
      checkOut: co,
      guests,
      totalPrice: total
    });

    await newBooking.save();

    res.redirect(`/bookings/${newBooking._id}`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};