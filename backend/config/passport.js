const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Google Strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      proxy: true, // Trust proxies (vital for Docker/Nginx/Render/Heroku)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If not found by googleId, check by email
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            // If found by email, link Google ID to this account
            user.googleId = profile.id;
            await user.save();
          } else {
            // If no user exists, create new one
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
