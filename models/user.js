const mongoose = require("mongoose");

const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
  },

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },
  ],

  avatar: {

    url: {
      type: String,
      default: "/default-user.png",
    },

    filename: {
      type: String,
      default: "",
    },
  },

  googleId: {
    type: String,
    default: "",
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

});


// ✅ IMPORTANT
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);