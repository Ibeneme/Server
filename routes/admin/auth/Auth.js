const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//const { sendOTP } = require("../utils/sendOTP");
//const genAuthToken = require("../utils/genAuthToken");
const Admin = require("../../../models/Admin/Admin");
const OTP = require("../../../models/Otp");
const { sendOTP } = require("../../../services/mailing/sendMail");
const genAdminAuthToken = require("../../../utils/genAdminToken");

// Admin Registration Route
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    let admin = await Admin.findOne({ email });

    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    admin = new Admin({ email, password });
    await admin.save();

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate OTP
    await sendOTP(email, otp);

    res.status(201).json({ message: "Admin registered, OTP sent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = genAdminAuthToken(admin); // Generate token using your utility function

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTP(email, otp);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password Route with OTP Validation
router.post("/reset-password", async (req, res) => {
  const { email, password, otp } = req.body;

  try {
    const validOTP = await OTP.findOne({ email, otp });

    if (!validOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    await admin.save();

    await OTP.deleteOne({ email, otp }); // Delete OTP after use

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Password Route (Reset without OTP)
router.post("/create-password", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    await admin.save();

    res.json({ message: "Password created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP Route
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate new OTP
    await sendOTP(email, otp);

    res.json({ message: "OTP resent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
