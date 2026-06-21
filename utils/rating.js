const Listing = require("../models/listing");

async function recalcRating(listingId) {
  const listing = await Listing.findById(listingId).populate("reviews");

  if (!listing) return;

  const count = listing.reviews.length;

  const avg =
    count === 0
      ? 0
      : listing.reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  listing.avgRating = avg.toFixed(1);
  listing.reviewCount = count;

  await listing.save();
}

module.exports = recalcRating;