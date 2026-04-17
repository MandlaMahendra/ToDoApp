const nodemailer = require("nodemailer");

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Send OTP verification email
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"TaskFlow Pro 🔐" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Login Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🔐 Verification Code</h1>
        </div>
        <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hi there,</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Use the code below to complete your login. This code expires in <strong>5 minutes</strong>.</p>
          
          <div style="background: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 16px 0 0;">TaskFlow Pro — Organize Your Day</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent to:", toEmail, "Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendOTPEmail, generateOTP };
