const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");

let lastQuery = {};

router.post("/ai-help", async (req, res) => {
  try {
    const userId = req.user ? req.user._id.toString() : "guest";
    let msg = (req.body.message || "").toLowerCase();

    lastQuery[userId] = lastQuery[userId] || {};

    let reply = "";

    const locationMatch = msg.match(/in\s([a-zA-Z\s]+)/);
    const location = locationMatch ? locationMatch[1].trim() : null;

    let priceFilter = {};

    if (msg.includes("cheap") || msg.includes("budget")) {
      priceFilter = { price: { $lte: 1500 } };
    } else if (msg.includes("luxury")) {
      priceFilter = { price: { $gte: 4000 } };
    }

    if (msg.includes("same location")) {
      msg = "in " + (lastQuery[userId].location || "");
    }

    if (msg.includes("hi") || msg.includes("hello")) {
      reply = "Hey 👋 What kind of stay are you looking for?";
    }

    else if (location) {
      lastQuery[userId].location = location;

      const listings = await Listing.find({
        location: { $regex: location, $options: "i" },
        ...priceFilter
      }).limit(5);

      if (!listings.length) {
        reply = `No stays found in ${location} 😢`;
      } else {
        reply = `🏨 Stays in ${location}:<br>`;
        listings.forEach(l => {
          reply += `• <b>${l.title}</b> - ₹${l.price}<br>`;
        });
      }
    }

    else if (msg.includes("cheap")) {
      const listings = await Listing.find().sort({ price: 1 }).limit(3);

      reply = "💸 Budget stays:<br>";
      listings.forEach(l => {
        reply += `• ${l.title} - ₹${l.price}<br>`;
      });
    }

    else if (msg.includes("recommend")) {
      const listings = await Listing.find().limit(3);

      reply = "⭐ Recommended stays:<br>";
      listings.forEach(l => {
        reply += `• ${l.title} - ₹${l.price}<br>`;
      });
    }

    else if (msg.includes("login") || msg.includes("sign in")) {
  reply = `
  🔐 To login:
  <br>1. Click Login in navbar
  <br>2. Enter your email & password
  <br>3. Or use Google Login
  <br><a href="/login">👉 Go to Login</a>
  `;
}

else if (msg.includes("signup") || msg.includes("register")) {
  reply = `
  📝 Create account:
  <br>1. Click Signup
  <br>2. Fill username, email, password
  <br><a href="/signup">👉 Sign up here</a>
  `;
}

else if (msg.includes("book") || msg.includes("reservation")) {
  reply = `
  🏨 How to book a stay:
  <br>1. Open any listing
  <br>2. Click <b>Reserve</b>
  <br>3. Select dates
  <br>4. Confirm booking
  <br><br>👉 Browse listings: <a href="/listings">View stays</a>
  `;
}

else if (msg.includes("cancel")) {
  reply = `
  ❌ To cancel booking:
  <br>1. Go to your bookings page
  <br>2. Find your booking
  <br>3. Click Cancel
  <br><a href="/bookings">👉 My bookings</a>
  `;
}

else if (msg.includes("favorite") || msg.includes("wishlist")) {
  reply = `
  ❤️ Save your favorite stays:
  <br>• Click ❤️ on any listing
  <br>• View later in your profile
  <br><a href="/favorites">👉 View favorites</a>
  `;
}

else if (msg.includes("profile")) {
  reply = `
  👤 Manage your profile:
  <br>• Update photo
  <br>• Edit username/email
  <br>• Change password
  <br><a href="/profile">👉 Go to profile</a>
  `;
}

else if (msg.includes("my booking") || msg.includes("my bookings")) {
  reply = `
  📅 Your bookings:
  <br>View all your reservations here:
  <br><a href="/bookings">👉 My bookings</a>
  `;
}

else if (msg.includes("help")) {
  reply = `
  🤖 I can help you with:
  <br>• 🔍 Find stays (e.g. "Hotels in Pune")
  <br>• 💸 Cheap or luxury stays
  <br>• 🏨 Booking help
  <br>• ❌ Cancel booking
  <br>• 🔐 Login / Signup
  `;
}



    else {
      reply = "😅 sorry! Try asking:<br>• Hotels in Pune<br>• Cheap stays<br>• Luxury stays";
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong!" });
  }
});

module.exports = router;