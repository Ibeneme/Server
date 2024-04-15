const express = require("express");
const otpGenerator = require("otp-generator");
const { sendOTP } = require("../../services/mailing/sendMail");
const localVariables = require("../../middleware/localVariable");
const User = require("../../models/Users");
const OTP = require("../../models/Otp");

const router = express.Router();

router.use(localVariables);

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    console.log(email, "emailemailemail");
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    // Create or update OTP record in the database
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), otp: otp },
      { upsert: true, new: true }
    );

    // Send OTP via email
    await sendOTP(email.toLowerCase(), otp);
    console.log("Generated OTP for email:", email, otp);

    res.status(200).json({ email, otp });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/sendotp/:email", async (req, res) => {
  try {
    const { email } = req.params;

    console.log(email, "emailemailemail");
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    // Create or update OTP record in the database
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), otp: otp },
      { upsert: true, new: true }
    );

    // Send OTP via email
    await sendOTP(email.toLowerCase(), otp);
    console.log("Generated OTP for email:", email, otp);

    res.status(200).json({ email, otp });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
