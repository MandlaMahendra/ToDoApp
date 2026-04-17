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
    const { name, password } = req.body;
    const email = (req.body.email || "").toLowerCase().trim();
    console.log(`[AUTH] Registering user: ${email}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[AUTH] Registration failed: Email ${email} already exists.`);
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });

    await user.save();
    console.log(`[AUTH] User registered successfully: ${email}`);
    res.json({ message: "User registered" });
  } catch (error) {
    console.error(`[AUTH] Register Error for ${req.body.email}:`, error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN — Step 1: Validate credentials and send OTP
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = (req.body.email || "").toLowerCase().trim();

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter username and password" });
    }

    console.log(`[AUTH] Login attempt for: ${email}`);

    // 2. Database Validation (Check user existence)
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] Login failed: No user found for ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Password Validation
    const isMatch = user.password && await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[AUTH] Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Generate OTP (Only after valid credentials)
    const otp = generateOTP();
    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    // 5. Send OTP
    try {
      console.log(`[AUTH] Sending OTP email to: ${email}`);
      await sendOTPEmail(email, otp);
      console.log(`[AUTH] ✅ OTP delivery successful for: ${email}`);
    } catch (emailErr) {
      console.error(`[AUTH] ❌ OTP Send Failed for ${email}:`, emailErr.message);
      // Fallback: log for dev
      console.log(`[DEBUG LOG] OTP for ${email}: ${otp}`);
    }

    // 6. Finalize OTP Storage
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    res.json({ otpRequired: true, message: "Verification code sent to your email" });
  } catch (error) {
    console.error(`[AUTH] Login Crash for ${req.body.email || "Unknown"}:`, error.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// LOGIN — Step 2: Verify OTP and return token
router.post("/verify-otp", async (req, res) => {
  try {
    const { otp } = req.body;
    const email = (req.body.email || "").toLowerCase().trim();
    console.log(`[AUTH] OTP verification attempt for: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] Verification failed: User not found for ${email}`);
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpires) {
      console.log(`[AUTH] Verification failed: No OTP record for ${email}`);
      return res.status(400).json({ message: "No verification code found. Please login again." });
    }

    if (new Date() > user.otpExpires) {
      console.log(`[AUTH] Verification failed: OTP expired for ${email}`);
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: "Verification code expired. Please login again." });
    }

    if (user.otp !== otp) {
      console.log(`[AUTH] Verification failed: Invalid code provided for ${email}`);
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

    console.log(`[AUTH] ✅ OTP verified, login successful for: ${email}`);
    res.json({ token });
  } catch (error) {
    console.error(`[AUTH] OTP Verification Error for ${req.body.email}:`, error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    console.log(`[AUTH] Resend OTP requested for: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] Resend failed: User not found for ${email}`);
      return res.status(400).json({ message: "User not found" });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    console.log(`[AUTH] New OTP generated for ${email}: ${otp}`);

    try {
      console.log(`[AUTH] Attempting to resend OTP email to: ${email}`);
      await sendOTPEmail(email, otp);
      console.log(`[AUTH] ✅ OTP resent successfully to: ${email}`);
    } catch (emailErr) {
      console.error(`[AUTH] ❌ Resend email failed for ${email}:`, emailErr.message);
      console.log(`[DEBUG] Resend OTP for ${email}: ${otp}`);
    }

    res.json({ message: "New verification code sent" });
  } catch (error) {
    console.error(`[AUTH] Resend OTP Error for ${req.body.email}:`, error);
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
  async (req, res) => {
    try {
      const user = req.user;
      const email = user.email.toLowerCase();

      // Enforce OTP for Google Login
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      console.log(`[AUTH] Google Login successful for ${email}. Enforcing OTP...`);
      
      try {
        await sendOTPEmail(email, otp);
        console.log(`[AUTH] ✅ OTP email sent to ${email} (via Google Login)`);
      } catch (emailErr) {
        console.error(`[AUTH] ❌ Google Login OTP email failed for ${email}:`, emailErr.message);
        console.log(`[DEBUG] Google OTP for ${email}: ${otp}`);
      }

      // Redirect to frontend OTP step
      res.redirect(`${frontendUrl}/login?step=otp&email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("❌ Google Callback Error:", error);
      res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }
);

module.exports = router;
