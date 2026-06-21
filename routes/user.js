const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const Listing = require("../models/listing.js");

const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");

const { saveRedirectUrl, isLoggedIn } = require("../middleware");

const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });

const userDashboardController = require("../controllers/userDashboard.js");
const userController = require("../controllers/users.js");


// ================= SIGNUP =================
router.route("/signup")
  .get(userController.renderSignupForm)
  .post(
  upload.single("avatar"),
  userController.signup
);


// ================= LOGIN =================
router.route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true
    }),
    userController.login
  );


// ================= PROFILE AVATAR =================
router.post(
  "/profile/avatar",
  isLoggedIn,
  upload.single("avatar"),
  async (req, res) => {

    if (!req.file) {
      req.flash("error", "No file uploaded!");
      return res.redirect("/profile");
    }

    const user = await User.findById(req.user._id);

    user.avatar = {
      url: req.file.path,
      filename: req.file.filename
    };

    await user.save();

    req.flash("success", "Profile image updated!");
    res.redirect("/profile");
  }
);


// ================= LOGOUT =================
router.get("/logout", userController.logout);


// ================= PROFILE =================
router.get("/profile", isLoggedIn, (req, res) => {
  res.render("users/profile", { user: req.user });
});

router.get("/profile/edit", isLoggedIn, (req, res) => {
  res.render("users/editProfile", { user: req.user });
});

router.put("/profile", isLoggedIn, async (req, res) => {
  const { username, email } = req.body;

  await User.findByIdAndUpdate(req.user._id, { username, email });

  res.redirect("/profile");
});


// ================= MY LISTINGS =================
router.get("/mylistings", isLoggedIn, async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id });
  res.render("users/myListings", { listings });
});


// ADD / REMOVE FAVORITE
router.post("/favorite/:id", isLoggedIn, async (req, res) => {

  const listingId = req.params.id;
  const user = await User.findById(req.user._id);

  const exists = user.favorites.includes(listingId);

  if (exists) {
    user.favorites.pull(listingId);
  } else {
    user.favorites.push(listingId);
  }

  await user.save();

  res.json({
    success: true,
    isFav: !exists
  });

});



// WISHLIST PAGE
// WISHLIST PAGE
router.get("/wishlist", isLoggedIn, async (req, res) => {

  const user = await User.findById(req.user._id)
    .populate("favorites");

  res.render("listings/wishlist", {
    listings: user.favorites,
  });
});


// ================= CHANGE PASSWORD =================
router.get("/change-password", isLoggedIn, (req, res) => {
  res.render("users/changePassword");
});

router.post("/change-password", isLoggedIn, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  try {
    await user.changePassword(oldPassword, newPassword);
    req.flash("success", "Password changed successfully!");
    res.redirect("/profile");
  } catch (err) {
    req.flash("error", "Incorrect old password!");
    res.redirect("/change-password");
  }
});


// ================= DASHBOARD =================
router.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("users/dashboard");
});

router.get("/dashboard-data", isLoggedIn, userDashboardController.getDashboardData);

router.get("/dashboard/:id", isLoggedIn, userDashboardController.getListingDashboard);


module.exports = router;