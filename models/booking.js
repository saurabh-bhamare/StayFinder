const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  checkIn: Date,

  checkOut: Date,

  guests: Number,

  totalPrice: Number,

  // ✅ Dynamic weather pricing
  pricePerNight: {
    type: Number
  },

  weatherType: {
    type: String
  },

  // 🌡 Optional
  temperature: {
    type: Number
  }

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);