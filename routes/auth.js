const express = require("express");
const router = express.Router();
const passport = require("passport");

// Step 1: Redirect to Google
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Callback
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: "/listings"
  })
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

module.exports = router;