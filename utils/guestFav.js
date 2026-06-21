const Listing = require("../models/listing");

async function updateGuestFavorite(listingId) {
  const listing = await Listing.findById(listingId);

  if (!listing) return;

  const favCount = listing.favoritedBy.length;

  listing.isGuestFavorite =
    listing.avgRating >= 4.5 && favCount >= 5;

  await listing.save();
}

module.exports = updateGuestFavorite;