const express = require("express");
const router = express.Router({ mergeParams: true });  // IMPORTANT for nested routes
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/reviews.js");
const Listing = require("../models/listing.js");   // <-- FIXED (missing import)
const {validateReview,isLoggedIn,isReviewAuthor}=require("../middleware.js");

const reviewController = require("../controllers/reviews.js");



//post reiew Route
router.post("/", 
  isLoggedIn, 
  validateReview, 
  wrapAsync(reviewController.createReview)
);





// DELETE REVIEW route
router.delete(
  "/:reviewId", 
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewController.destroyReview)
);



module.exports = router;
