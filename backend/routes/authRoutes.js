const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const { sendOTPEmail, generateOTP } = require("../utils/emailService");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });

    await user.save();
    res.json({ message: "User registered" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN — Step 1: Validate credentials and send OTP
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    // Send OTP email (non-fatal if it fails)
    try {
      await sendOTPEmail(email, otp);
      console.log("✅ OTP email sent to:", email);
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr.message);
      console.log(`🔑 [DEBUG] OTP for ${email}: ${otp}`); // visible in Render logs
    }

    res.json({ otpRequired: true, message: "Verification code sent to your email" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// LOGIN — Step 2: Verify OTP and return token
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("OTP verification for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: "No verification code found. Please login again." });
    }

    if (new Date() > user.otpExpires) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: "Verification code expired. Please login again." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // OTP verified — clear it and generate token
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    console.log("OTP verified, login successful for:", email);
    res.json({ token });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendOTPEmail(email, otp);
      console.log("✅ OTP resent to:", email);
    } catch (emailErr) {
      console.error("❌ Resend email failed:", emailErr.message);
      console.log(`🔑 [DEBUG] Resend OTP for ${email}: ${otp}`);
    }

    res.json({ message: "New verification code sent" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Failed to resend verification code" });
  }
});

// GET CURRENT USER
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Auth Me Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// GOOGLE AUTH INITIALIZE
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// GOOGLE AUTH CALLBACK
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${frontendUrl}/login` }),
  (req, res) => {
    try {
      // Generate JWT for the authenticated user
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET || "todo_secret", // Use same secret as other routes
        { expiresIn: "1d" }
      );

      console.log("✅ Google Auth successful, redirecting to frontend");
      // Redirect back to frontend dashboard with the token
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    } catch (error) {
      console.error("❌ Google Callback Error:", error);
      res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }
);

module.exports = router;
