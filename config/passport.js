const passport = require("passport");

const LocalStrategy = require("passport-local").Strategy;

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/user");


// ======================================================
// LOCAL STRATEGY
// ======================================================

passport.use(
  new LocalStrategy(User.authenticate())
);


// ======================================================
// GOOGLE STRATEGY
// ======================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {

        let existingUser = await User.findOne({
          googleId: profile.id,
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails?.[0]?.value || "",
        });

        await newUser.save();

        return done(null, newUser);

      } catch (err) {

        return done(err, null);

      }
    }
  )
);


// ======================================================
// SESSION
// ======================================================

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());


// ======================================================

module.exports = passport;