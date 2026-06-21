const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

console.log("Stripe Key Loaded:", !!process.env.STRIPE_SECRET_KEY);

module.exports = stripe;