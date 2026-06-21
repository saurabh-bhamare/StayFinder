const User = require("../models/user");
const Listing = require("../models/listing");
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const festivals = require("../utils/festivalData");
const getWeather = require("../utils/weather");
const getDynamicPrice = require("../utils/dynamicPricing");

const upload = multer({ storage });



/* =========================
   FESTIVAL ROUTES FIRST
========================= */

// Show festival cards
router.get("/festivals", (req, res) => {
  res.render("festivals/index");
});

// Show locations
router.get("/festivals/:festivalName", (req, res) => {
  const { festivalName } = req.params;
  const locations = festivals[festivalName];

  if (!locations) return res.send("Festival not found");

  res.render("festivals/locations", { festivalName, locations });
});

// Show hotels


router.get(
  "/festivals/:festivalName/:city",
  wrapAsync(async (req, res) => {
    const { festivalName, city } = req.params;
    const { maxPrice, crowd, family } = req.query;

    let query = {
      location: { $regex: city, $options: "i" } // ✅ FIXED
    };

    if (maxPrice) query.price = { $lte: maxPrice };
    if (crowd) query.crowdLevel = crowd;
    if (family) query.isFamilyFriendly = true;

    const hotels = await Listing.find(query);

    console.log("CITY:", city);
    console.log("HOTELS FOUND:", hotels.length);

    res.render("listings/festivalResults", {
      hotels,
      festivalName,
      city,
      query: req.query
    });
  })
);


/* =========================
   INDEX & CREATE
========================= */

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
  isLoggedIn,
  upload.single("image"),
  (req, res, next) => {
    console.log("FILE:", req.file); // ✅ correct place
    next();
  },
  validateListing,
  wrapAsync(listingController.createListing)
);

/* =========================
   NEW LISTING FORM
========================= */

router.get(
  "/new",
  isLoggedIn,
  wrapAsync(listingController.renderNewForm)
);
/* =========================
   SHOW, UPDATE, DELETE
========================= */

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
  isLoggedIn,
  isOwner,
  upload.single("image"), // ✅ MUST match
  validateListing,
  wrapAsync(listingController.updateListing)
)
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.deleteListing)
  );

/* =========================
   EDIT FORM
========================= */

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

router.post("/favorite/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);

  if (!user.favorites.includes(id)) {
    user.favorites.push(id);
  } else {
    user.favorites.pull(id);
  }

  await user.save();
   // 🏆 update guest favourite
 


  res.redirect(req.get("referer")); // better redirect
});


module.exports = router;