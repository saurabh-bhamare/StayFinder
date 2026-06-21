const Listing = require("../models/listing");
const Booking = require("../models/booking");
const getWeather = require("../utils/weather");
const getDynamicPrice = require("../utils/dynamicPricing");

// ======================================================
// INDEX PAGE
// ======================================================
module.exports.index = async (req, res) => {

  const { q, category, minPrice, maxPrice, sort, location } = req.query;

  let filter = {};

  // 🔎 SEARCH
  if (q && q.trim() !== "") {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } }
    ];
  }

  // 🏷 CATEGORY
  if (category && category.trim() !== "") {
    filter.category = category;
  }

  // 💰 PRICE RANGE
  if (minPrice || maxPrice) {

    filter.price = {};

    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  // 📍 LOCATION FILTER
  if (location && location.trim() !== "") {
    filter.location = { $regex: location, $options: "i" };
  }

  // 🔃 SORTING
  let sortOption = {};

  if (sort === "low") {
    sortOption.price = 1;
  }

  if (sort === "high") {
    sortOption.price = -1;
  }

  // 📦 FETCH LISTINGS
  const listings = await Listing.find(filter).sort(sortOption);

  // ======================================================
  // 🌦 WEATHER + DYNAMIC PRICING
  // ======================================================
  for (let listing of listings) {

  const result = await getDynamicPrice(listing);

  listing.dynamicPrice = result.dynamicPrice;

  listing.priceTag = result.priceTag;

  listing.weatherData = result.weatherData;
}

  // ======================================================
  // 🔥 ACTIVE BOOKINGS
  // ======================================================
  const today = new Date();

  const bookings = await Booking.find({
    checkIn: { $lte: today },
    checkOut: { $gte: today }
  });

  const bookedListingIds = bookings.map(
    b => b.listing.toString()
  );

  // attach booking status
  listings.forEach(listing => {

    listing.isBooked = bookedListingIds.includes(
      listing._id.toString()
    );
  });

  // ======================================================
  // ✅ RENDER PAGE
  // ======================================================
  res.render("listings/index", {

    allListing: listings,

    q,
    category,
    minPrice,
    maxPrice,
    sort,
    location
  });
};

// ======================================================
// NEW FORM
// ======================================================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ======================================================
// CREATE LISTING
// ======================================================
module.exports.createListing = async (req, res) => {

  try {

    const newListing = new Listing(req.body.listing);

    // owner
    newListing.owner = req.user._id;

    // image upload
    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    await newListing.save();

    req.flash("success", "Listing created successfully!");

    res.redirect(`/listings/${newListing._id}`);

  } catch (err) {

    console.log(err);

    req.flash("error", err.message);

    res.redirect("/listings/new");
  }
};

// ======================================================
// SHOW LISTING
// ======================================================
module.exports.showListing = async (req, res) => {

  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner");

  if (!listing) {

    req.flash("error", "Listing not found");

    return res.redirect("/listings");
  }

  // 🌦 WEATHER DATA
  const result = await getDynamicPrice(listing);

const dynamicPrice = result.dynamicPrice;

const weatherData = result.weatherData;

const priceTag = result.priceTag;

  // 📊 Charts
  let monthlyBookings = [];
  let cancellationTrend = [];

  try {

    // 📈 Monthly bookings
    monthlyBookings = await Booking.aggregate([
      { $match: { listing: listing._id } },

      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },

      { $sort: { _id: 1 } }
    ]);

    // 📉 Cancellation trend
    cancellationTrend = await Booking.aggregate([
      { $match: { listing: listing._id } },

      {
        $group: {
          _id: { $month: "$createdAt" },

          cancelled: {
            $sum: {
              $cond: [
                { $eq: ["$status", "cancelled"] },
                1,
                0
              ]
            }
          },

          total: { $sum: 1 }
        }
      },

      { $sort: { _id: 1 } }
    ]);

  } catch (err) {

    console.log("Chart Error:", err);
  }

  // ✅ render show page
  res.render("listings/show", {

    listing,

    monthlyBookings,

    cancellationTrend,

    weatherData,

    dynamicPrice
  });
};

// ======================================================
// EDIT FORM
// ======================================================
module.exports.renderEditForm = async (req, res) => {

  const { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {

    req.flash("error", "Cannot find that listing!");

    return res.redirect("/listings");
  }

  const originalImageUrl =
    listing.image?.url || "/images/default.jpg";

  res.render("listings/edit.ejs", {
    listing,
    originalImageUrl
  });
};

// ======================================================
// UPDATE LISTING
// ======================================================
module.exports.updateListing = async (req, res) => {

  const { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {

    req.flash("error", "Listing not found!");

    return res.redirect("/listings");
  }

  Object.assign(listing, req.body.listing);

  // update image
  if (req.file) {

    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");

  res.redirect(`/listings/${id}`);
};

// ======================================================
// DELETE LISTING
// ======================================================
module.exports.deleteListing = async (req, res) => {

  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing deleted!");

  res.redirect("/listings");
};