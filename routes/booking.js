const express = require("express");
const router = express.Router({ mergeParams: true });

const { isLoggedIn } = require("../middleware");

const Booking = require("../models/booking");
const Listing = require("../models/listing");

const stripe = require("../config/stripe");
const getDynamicPrice = require("../utils/dynamicPricing");


// =====================================
// SHOW BOOKING PAGE
// =====================================
router.get("/new", isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    const result = await getDynamicPrice(listing);

    res.render("bookings/new", {
      listing,
      dynamicPrice: result.dynamicPrice,
      weatherData: result.weatherData,
      priceTag: result.priceTag,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading booking page");
  }
});


// =====================================
// CHECK AVAILABILITY
// =====================================
router.post("/check-availability", isLoggedIn, async (req, res) => {
  try {

    const { checkIn, checkOut, listingId } = req.body;

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) {
      return res.json({ available: false });
    }

    const conflict = await Booking.findOne({
      listing: listingId,
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    });

    res.json({
      available: !conflict,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      available: false,
    });
  }
});


// =====================================
// STRIPE CHECKOUT SESSION
// =====================================
router.post("/create-checkout-session", isLoggedIn, async (req, res) => {
  try {

    const listingId = req.params.id;

    const {
      checkIn,
      checkOut,
      guests
    } = req.body;

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found"
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (end <= start) {
      return res.status(400).json({
        error: "Invalid date range"
      });
    }

    const conflict = await Booking.findOne({
      listing: listingId,
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    });

    if (conflict) {
      return res.status(400).json({
        error: "Selected dates already booked"
      });
    }

    const result = await getDynamicPrice(listing);

    const dynamicPrice = result.dynamicPrice;

    const nights = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );

    const totalPrice = nights * dynamicPrice;

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",

            product_data: {
              name: listing.title,
              description: listing.location,
            },

            unit_amount: totalPrice * 100,
          },

          quantity: 1,
        },
      ],

      metadata: {
        listingId,
        userId: req.user._id.toString(),
        checkIn,
        checkOut,
        guests: guests || 1,
      },

      success_url:
        `${req.protocol}://${req.get("host")}/listings/${listingId}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${req.protocol}://${req.get("host")}/listings/${listingId}/bookings/cancel`,
    });

    res.json({
      url: session.url,
    });

  } catch (err) {

    console.log("STRIPE ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// =====================================
// PAYMENT SUCCESS
// =====================================
router.get("/success", isLoggedIn, async (req, res) => {
  try {

    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.redirect("/bookings");
    }

    const session =
      await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {

      req.flash(
        "error",
        "Payment not completed"
      );

      return res.redirect("/bookings");
    }

    const {
      listingId,
      checkIn,
      checkOut,
      guests
    } = session.metadata;

    const existingBooking = await Booking.findOne({
      user: req.user._id,
      listing: listingId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
    });

    if (!existingBooking) {

      const listing = await Listing.findById(listingId);

      const result = await getDynamicPrice(listing);

      const dynamicPrice = result.dynamicPrice;

      const start = new Date(checkIn);
      const end = new Date(checkOut);

      const nights = Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
      );

      const totalPrice = nights * dynamicPrice;

      await Booking.create({

        listing: listingId,

        user: req.user._id,

        checkIn: start,

        checkOut: end,

        guests,

        totalPrice,

        pricePerNight: dynamicPrice,

        weatherType:
          result.weatherData?.weather || "Normal",

        temperature:
          result.weatherData?.temp || null
      });
    }

    req.flash(
      "success",
      "🎉 Payment Successful! Booking Confirmed."
    );

    res.redirect("/bookings");

  } catch (err) {

    console.log(err);

    req.flash(
      "error",
      "Something went wrong"
    );

    res.redirect("/bookings");
  }
});


// =====================================
// PAYMENT CANCEL
// =====================================
router.get("/cancel", isLoggedIn, (req, res) => {

  req.flash(
    "error",
    "Payment Cancelled"
  );

  res.redirect(
    `/listings/${req.params.id}/bookings/new`
  );
});


// =====================================
// ALL BOOKINGS
// =====================================
router.get("/", isLoggedIn, async (req, res) => {

  try {

    const bookings = await Booking.find({
      user: req.user._id
    }).populate("listing");

    res.render("bookings/index", {
      bookings
    });

  } catch (err) {

    console.log(err);

    res.status(500).send("Error loading bookings");
  }
});


// =====================================
// DELETE BOOKING
// =====================================
router.delete("/:id", isLoggedIn, async (req, res) => {

  try {

    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.redirect("/bookings");
    }

    await Booking.findByIdAndDelete(
      req.params.id
    );

    req.flash(
      "success",
      "Booking cancelled successfully"
    );

    res.redirect("/bookings");

  } catch (err) {

    console.log(err);

    req.flash(
      "error",
      "Unable to cancel booking"
    );

    res.redirect("/bookings");
  }
});

module.exports = router;