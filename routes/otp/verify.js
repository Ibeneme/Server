const express = require("express");
const User = require("../../models/Users");
const OTP = require("../../models/Otp");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { email, code } = req.body;

    // Convert email to lowercase
    email = email.toLowerCase();

    console.log(email, code);
    if (!email || !code) {
      return res.status(400).json({ error: "Email or OTP code is missing" });
    }
    const storedOTP = await OTP.findOne({ email, otp: code });

    if (!storedOTP) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    const currentTime = new Date();
    const otpCreatedAt = new Date(storedOTP.createdAt);
    const otpExpirationTime = new Date(otpCreatedAt.getTime() + 5 * 60 * 1000); // 5 minutes expiration
    // if (currentTime > otpExpirationTime) {
    //   return res.status(400).json({ error: "OTP has expired" });
    // }

    const user = await User.findOne({ email });
    if (user && !user.verified) {
      await User.findOneAndUpdate({ email }, { $set: { verified: true } });
    }
    await OTP.deleteOne({ email, otp: code });

    return res.status(200).json({ msg: "Verification Successful" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
