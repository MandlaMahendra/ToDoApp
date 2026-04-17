import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../api";

export default function Login({ setAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const location = useLocation();

  // Handle Google OAuth Redirect with OTP
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get("step");
    const emailParam = params.get("email");

    if (stepParam === "otp" && emailParam) {
      setEmail(emailParam);
      setStep(2);
      startResendTimer();
    }
  }, [location]);

  // Start 30-second resend countdown
  function startResendTimer() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  async function login() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed"); return; }

      if (data.otpRequired) {
        setStep(2);
        startResendTimer();
      }
    } catch (err) {
      setError("Unable to connect to server. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    const otpValue = otp.join("");
    if (otpValue.length !== 6) { setError("Please enter the 6-digit code"); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Verification failed"); return; }
      localStorage.setItem("token", data.token);
      setAuth(true);
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (resendTimer > 0) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      startResendTimer();
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError("Failed to resend code.");
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL || "http://localhost:5000"}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-3xl md:text-5xl font-extrabold text-white mb-10 tracking-wide text-center"
      >
        Organize Your Day
      </motion.h1>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-[90%] max-w-[360px]"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome Back 👋</h2>

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

            <input
              type="email"
              placeholder="Email"
              className="w-full mb-3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />

            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition font-semibold disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Login"}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-300"></div>
              <span className="px-2 text-gray-500 text-sm">OR</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>

            <p className="text-sm text-center mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-600 cursor-pointer font-semibold">Register</Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35 }}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-[90%] max-w-[360px]"
          >
            {/* Lock icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">🔐</div>
            </div>

            <h2 className="text-2xl font-bold mb-1 text-center">Verify It's You</h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              We sent a 6-digit code to<br/>
              <span className="font-semibold text-indigo-600">{email}</span>
            </p>

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

            {/* OTP boxes */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                />
              ))}
            </div>

            <button
              onClick={verifyOtp}
              disabled={loading || otp.join("").length !== 6}
              className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition font-semibold disabled:opacity-60 mb-3"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => { setStep(1); setError(""); setOtp(["","","","","",""]); }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <button
                onClick={resendOtp}
                disabled={resendTimer > 0}
                className="text-indigo-600 font-semibold hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
