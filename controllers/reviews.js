const Reviews = require("../models/Reviews");
const Listing = require("../models/listing");
const recalcRating = require("../utils/rating");

module.exports.createReview = async (req, res) => {
  const { id } = req.params;

  const review = new Reviews(req.body.review);
  review.author = req.user._id;

  const listing = await Listing.findById(id);
  listing.reviews.push(review);

  await review.save();
  await listing.save();

  await recalcRating(id);

  res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId }
  });

  // ✅ FIXED HERE
  await Reviews.findByIdAndDelete(reviewId);

  await recalcRating(id);

  req.flash("success", "Review Deleted!");
  res.redirect(`/listings/${id}`);
};