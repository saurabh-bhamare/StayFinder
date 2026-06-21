if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const stripe = require("./config/stripe");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");

const session = require("express-session");
const flash = require("connect-flash");
// ✅ IMPORT YOUR PASSPORT CONFIG FILE
const passport = require("./config/passport");

const User = require("./models/user.js");

// ROUTES
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRoutes = require("./routes/booking");
const aiRoutes = require("./routes/ai");
const authRoutes = require("./routes/auth");



// ======================================================
// DATABASE
// ======================================================

const dbUrl = process.env.ATLASDB_URL;

console.log("Mongo URL exists:", !!process.env.ATLASDB_URL);

main()
  .then(() => {
    console.log("Connected to Mongo Atlas");
  })
  .catch((err) => {
    console.log("Mongo Error:", err);
  });

async function main() {
  console.log("Trying to connect MongoDB...");
  await mongoose.connect(dbUrl);
}
// ======================================================
// EXPRESS CONFIG
// ======================================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// SESSION CONFIG
// ======================================================

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};
app.set("trust proxy", 1);
app.use(session(sessionOptions));

// ======================================================
// FLASH
// ======================================================

app.use(flash());

// ======================================================
// PASSPORT
// ======================================================

app.use(passport.initialize());
app.use(passport.session());

// ❌ DO NOT ADD:
// passport.use(new LocalStrategy(...))
// serializeUser()
// deserializeUser()

// Because everything is already configured
// inside ./config/passport.js

// ======================================================
// GLOBAL VARIABLES
// ======================================================

app.use((req, res, next) => {
  res.locals.currUser = req.user || null;

  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  next();
});

// ======================================================
// DEMO USER ROUTE
// ======================================================

app.get("/demouser", async (req, res, next) => {
  try {
    let fakeUser = new User({
      email: "student@gmail.com",
      username: "delta-student",
    });

    let registeredUser = await User.register(
      fakeUser,
      "helloworld"
    );

    res.send(registeredUser);

  } catch (err) {
    next(err);
  }
});

app.use((req, res, next) => {
  res.locals.currUser = req.user || null;
  next();
});

// ======================================================
// ROUTES
// ======================================================

app.use("/listings", listingRouter);

app.use("/listings/:id/reviews", reviewRouter);

app.use("/listings/:id/bookings", bookingRoutes);

app.use("/bookings", bookingRoutes);

app.use("/", userRouter);

app.use("/", aiRoutes);

app.use("/auth", authRoutes);

// ======================================================
// 404
// ======================================================

app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.log(err);

  const { statusCode = 500 } = err;

  res.status(statusCode).render("error", { err });
});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});