const Booking = require("../models/booking");
const Listing = require("../models/listing");

async function isAvailable(listingId, checkIn, checkOut) {
  const listing = await Listing.findById(listingId);

  // ✅ Convert all to Date ONLY (no time issue)
  const from = listing.availability?.from
    ? new Date(listing.availability.from).setHours(0,0,0,0)
    : null;

  const to = listing.availability?.to
    ? new Date(listing.availability.to).setHours(0,0,0,0)
    : null;

  checkIn = new Date(checkIn).setHours(0,0,0,0);
  checkOut = new Date(checkOut).setHours(0,0,0,0);

  // ✅ If no availability → allow booking
  if (!from || !to) return true;

  // ✅ FIX: allow boundary dates
  if (checkIn < from || checkOut > to) {
    return false;
  }

  // ✅ Check overlapping bookings
  const existing = await Booking.findOne({
    listing: listingId,
    $or: [
      {
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
      }
    ]
  });

  return !existing;
}

module.exports = isAvailable;