const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Google Strategy — only register if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.googleId = profile.id;
              await user.save();
            } else {
              user = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
              });
              await user.save();
            }
          }
          return done(null, user);
        } catch (err) {
          console.error("Error in Google Strategy:", err);
          return done(err, null);
        }
      }
    )
  );
  console.log("✔ Google OAuth strategy registered");
} else {
  console.warn("⚠ GOOGLE_CLIENT_ID not set — Google OAuth disabled");
}

// Serialization: Store user ID in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialization: Retrieve user by ID from session
passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

module.exports = passport;
