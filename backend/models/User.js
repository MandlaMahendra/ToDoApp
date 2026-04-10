const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  subscriptionPlan: { type: String, enum: ["free", "pro"], default: "free" },
  razorpayOrderId: String,
  razorpayPaymentId: String
});

module.exports = mongoose.model("User", userSchema);
