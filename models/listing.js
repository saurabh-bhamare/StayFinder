const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");
const { required } = require("joi");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  description: String,

  image: {
  url: String,
  filename: String
},

  price: {
    type: Number,
    required: true,
  },
  
  country: String,
  location: String,

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    }
  ],

avgRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },

 // 🏆 Guest Favourite flag (auto calculated)
  isGuestFavorite: {
    type: Boolean,
    default: false
  },

  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
  type: String,
  enum: [
    "Trending",
    "Mountains",
    "Camping",
    "Beach",
    "Luxury",
    "Forest",
    "City",
    "Farm",
    "Lake"
  ]
},
festivalTags: [String], // ["ganpati", "diwali"]
  nearbyFestivalSpot: String,
  crowdLevel: {
    type: String,
    enum: ["low", "medium", "high"]
  },
  isFamilyFriendly: Boolean
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({
      _id: { $in: listing.reviews },
    });
  }
});

listingSchema.virtual("status").get(function () {
  return this.isBooked ? "Booked" : "Available";
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
