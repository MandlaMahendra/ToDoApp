const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: String,
  subscriptionPlan: { type: String, enum: ["free", "pro"], default: "free" },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  otp: String,
  otpExpires: Date
});

module.exports = mongoose.model("User", userSchema);
