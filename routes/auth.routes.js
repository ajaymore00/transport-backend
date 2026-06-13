import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { generateSecret, generateToken, verifyToken } from "../utils/otp.service.js";
import { sendOtpSms } from "../utils/sms.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "transport-secret";
const TOKEN_EXPIRY = "7d";
const OTP_VALID_MINUTES = 10;

const sanitizeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.signupOtp;
  delete userObj.resetOtp;
  delete userObj.__v;
  return userObj;
};

// Signup: generate OTP, save secret, send SMS
router.post("/signup/send-otp", async (req, res) => {
  try {
    const {
      transporterName,
      ownerName,
      whatsappNumber,
      email,
      gstNo,
      mobileNumber,
      password,
      confirmPassword,
    } = req.body;

    if (
      !transporterName ||
      !ownerName ||
      !whatsappNumber ||
      !email ||
      !mobileNumber ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and confirm password do not match" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: "User with this email or mobile already exists" });
    }

    const secret = generateSecret();
    const otp = generateToken(secret);
    const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

    let user;
    if (existingUser) {
      existingUser.transporterName = transporterName;
      existingUser.ownerName = ownerName;
      existingUser.whatsappNumber = whatsappNumber;
      existingUser.gstNo = gstNo;
      existingUser.password = password;
      existingUser.signupOtp = { secret, expiresAt };
      existingUser.isVerified = false;
      user = await existingUser.save();
    } else {
      user = new User({
        transporterName,
        ownerName,
        whatsappNumber,
        email,
        gstNo,
        mobileNumber,
        password,
        roleId: 1,
        signupOtp: { secret, expiresAt },
      });
      await user.save();
    }

    const smsSent = await sendOtpSms(mobileNumber, otp, "signup OTP");
    return res.status(200).json({
      message: smsSent ? "OTP sent to mobile" : "OTP generated but SMS not sent",
      mobileNumber,
      expiresAt,
      user: sanitizeUser(user),
      smsSent,
    });
  } catch (error) {
    console.error("Signup OTP error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { mobileNumber, purpose } = req.body;
    if (!mobileNumber || !purpose) return res.status(400).json({ message: "mobileNumber and purpose are required" });
    if (!["signup", "forgot-password"].includes(purpose)) return res.status(400).json({ message: "purpose must be 'signup' or 'forgot-password'" });

    const user = await User.findOne({ mobileNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = generateSecret();
    const otp = generateToken(secret);
    const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

    if (purpose === "signup") {
      if (user.isVerified) return res.status(409).json({ message: "Account already verified" });
      user.signupOtp = { secret, expiresAt };
    } else {
      user.resetOtp = { secret, expiresAt };
    }

    await user.save();
    const smsSent = await sendOtpSms(mobileNumber, otp, purpose === "signup" ? "signup OTP" : "password reset OTP");

    return res.status(200).json({
      message: smsSent ? "OTP resent to mobile" : "OTP generated but SMS not sent",
      mobileNumber,
      purpose,
      expiresAt,
      smsSent,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verify signup OTP
router.post("/signup/verify-otp", async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) return res.status(400).json({ message: "Missing mobile number or OTP" });

    const user = await User.findOne({ mobileNumber });
    if (!user || !user.signupOtp?.secret) return res.status(404).json({ message: "Signup request not found" });
    if (!verifyToken(otp, user.signupOtp.secret)) return res.status(400).json({ message: "Invalid OTP" });
    if (user.signupOtp.expiresAt < new Date()) return res.status(400).json({ message: "OTP has expired" });

    user.isVerified = true;
    user.signupOtp = undefined;
    await user.save();
    return res.status(200).json({ message: "Mobile verified and account created", user: sanitizeUser(user) });
  } catch (error) {
    console.error("Signup verify error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    if (!mobileNumber || !password) return res.status(400).json({ message: "Mobile number and password are required" });

    const user = await User.findOne({ mobileNumber });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified) return res.status(401).json({ message: "Account not verified" });

    const validPassword = await user.comparePassword(password);
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error("Get /me error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ message: "Missing fields" });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: "Password mismatch" });

    const user = req.user;
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: "Current password incorrect" });

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Logout
router.post("/logout", authMiddleware, async (req, res) => {
  return res.status(200).json({ message: "Logged out" });
});

// Forgot password: generate reset OTP and send
router.post("/forgot-password/request", async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) return res.status(400).json({ message: "Mobile number is required" });

    const user = await User.findOne({ mobileNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = generateSecret();
    const otp = generateToken(secret);
    const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);
    user.resetOtp = { secret, expiresAt };
    await user.save();

    const smsSent = await sendOtpSms(mobileNumber, otp, "password reset OTP");
    return res.status(200).json({ message: smsSent ? "Reset OTP sent to mobile" : "Reset OTP generated but SMS not sent", mobileNumber, expiresAt, smsSent });
  } catch (error) {
    console.error("Forgot password request error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verify reset OTP and set new password
router.post("/forgot-password/verify", async (req, res) => {
  try {
    const { mobileNumber, otp, password, confirmPassword } = req.body;
    if (!mobileNumber || !otp || !password || !confirmPassword) return res.status(400).json({ message: "Missing required fields" });
    if (password !== confirmPassword) return res.status(400).json({ message: "Password and confirm password do not match" });

    const user = await User.findOne({ mobileNumber });
    if (!user || !user.resetOtp?.secret) return res.status(404).json({ message: "Reset request not found" });
    if (!verifyToken(otp, user.resetOtp.secret)) return res.status(400).json({ message: "Invalid OTP" });
    if (user.resetOtp.expiresAt < new Date()) return res.status(400).json({ message: "OTP has expired" });

    user.password = password;
    user.resetOtp = undefined;
    await user.save();
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Forgot password verify error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
