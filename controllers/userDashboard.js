const Listing = require("../models/listing");
const Booking = require("../models/booking");

// ===============================
// MAIN DASHBOARD (ALL LISTINGS)
// ===============================
module.exports.getDashboardData = async (req, res) => {
  const userId = req.user._id;

  const listings = await Listing.find({ owner: userId });

  const dashboardData = [];

  for (let listing of listings) {
    const bookings = await Booking.find({ listing: listing._id });

    const totalBookings = bookings.length;

    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );

    dashboardData.push({
      _id: listing._id, // 🔥 IMPORTANT for view details
      listingName: listing.title,
      totalBookings,
      totalRevenue
    });
  }

  res.json({ listings: dashboardData });
};

// ===============================
// SINGLE LISTING DASHBOARD
// ===============================
module.exports.getListingDashboard = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const listing = await Listing.findById(id);

  // 🔐 Security check
  if (!listing || !listing.owner.equals(userId)) {
    req.flash("error", "Unauthorized access");
    return res.redirect("/dashboard");
  }

  const bookings = await Booking.find({ listing: id }).populate("user");

  const totalBookings = bookings.length;

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (b.totalPrice || 0),
    0
  );

  const upcomingBookings = bookings.filter(
    b => new Date(b.checkIn) > new Date()
  );

  const cancelledBookings = bookings.filter(
    b => b.status === "cancelled"
  );

  const cancellationRate =
    totalBookings === 0
      ? 0
      : ((cancelledBookings.length / totalBookings) * 100).toFixed(1);

  // ===============================
  // 📊 MONTHLY BOOKINGS
  // ===============================
  const monthlyBookings = await Booking.aggregate([
    { $match: { listing: listing._id } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // ===============================
  // 📉 CANCELLATION TREND
  // ===============================
  const cancellationTrend = await Booking.aggregate([
    { $match: { listing: listing._id } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  res.render("users/listingDashboard", {
    listing,
    totalBookings,
    totalRevenue,
    upcomingBookings,
    cancellationRate,
    bookings,
    monthlyBookings,
    cancellationTrend
  });
};