const express = require("express");
const otpGenerator = require("otp-generator");
const { sendOTP } = require("../../services/mailing/sendMail");
const localVariables = require("../../middleware/localVariable");
const User = require("../../models/Users");
const OTP = require("../../models/Otp");

const router = express.Router();

router.use(localVariables);

router.get("/otp/:email", async (req, res) => {
    try {
      const { email } = req.params;
  
      // Generate a new OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });
  
      // Create a new OTP record
      const newOTPRecord = await OTP.create({ email: email.toLowerCase(), otp: otp });
  
      // Send OTP via email
      await sendOTP(email.toLowerCase(), otp);
      console.log("Generated OTP for email:", email, otp);
  
      // Respond with the email and OTP
      res.status(200).json({ email: newOTPRecord.email, otp: newOTPRecord.otp });
    } catch (error) {
      console.error("Error generating OTP:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

module.exports = router;
