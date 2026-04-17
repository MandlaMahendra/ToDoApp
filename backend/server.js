const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
require("dotenv").config();

const app = express();

// middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "todo_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// routes
const todoRoutes = require("./routes/todoRoutes");
app.use("/api/todos", todoRoutes);

// Auth Routes (Mount at both for legacy and new OAuth)
app.use("/auth", require("./routes/authRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✔ MongoDB Connected Successfully"))
.catch(err => {
  console.error("❌ MONGODB CONNECTION ERROR:");
  console.error(err.message);
  if (err.message.includes("whitelist")) {
    console.error("TIP: Ensure your Render IP (or 0.0.0.0/0) is whitelisted in MongoDB Atlas.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
