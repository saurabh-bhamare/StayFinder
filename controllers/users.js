const User = require("../models/user");

// =====================
// RENDER FORMS
// =====================
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

// =====================
// SIGNUP
// =====================
module.exports.signup = async (req, res) => {
  try {

    const { username, email, password } = req.body;

    const newUser = new User({ username, email });

    if (req.file) {
      newUser.avatar = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        req.flash("error", "Login failed");
        return res.redirect("/login");
      }

      req.flash("success", "Welcome!");
      res.redirect("/listings");
    });

  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

// =====================
// LOGIN
// =====================
module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back!");

  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// =====================
// LOGOUT
// =====================
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
};

module.exports.toggleFavorite = async (req, res) => {
  const listingId = req.params.id;
  const user = req.user;

  const index = user.favorites.indexOf(listingId);

  if (index === -1) {
    user.favorites.push(listingId);
  } else {
    user.favorites.splice(index, 1);
  }

  await user.save();
  res.redirect("back");
};

const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.getUserDashboard = async (req, res) => {
  const userId = req.user._id;

  const listings = await Listing.find({ owner: userId });
  const bookings = await Booking.find({ user: userId });

  // Revenue from user's listings
  const revenueData = await Booking.aggregate([
    {
      $lookup: {
        from: "listings",
        localField: "listing",
        foreignField: "_id",
        as: "listingData"
      }
    },
    { $unwind: "$listingData" },
    { $match: { "listingData.owner": userId } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" }
      }
    }
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  // Most popular listing
  const topListing = await Booking.aggregate([
    {
      $lookup: {
        from: "listings",
        localField: "listing",
        foreignField: "_id",
        as: "listingData"
      }
    },
    { $unwind: "$listingData" },
    { $match: { "listingData.owner": userId } },
    {
      $group: {
        _id: "$listingData.title",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  res.json({
    stats: {
      totalListings: listings.length,
      totalBookings: bookings.length,
      totalRevenue,
      totalSpent: bookings.reduce((a, b) => a + b.totalPrice, 0)
    },
    insights: {
      topListing: topListing[0]?._id || "N/A",
      upcomingTrips: bookings.filter(b => new Date(b.checkIn) > new Date()).length
    },
    recentBookings: bookings.slice(0, 3),
    recentListings: listings.slice(0, 3)
  });
};