const express = require("express");
const otpGenerator = require("otp-generator");
const { sendOTP } = require("../../services/mailing/sendMail");
const localVariables = require("../../middleware/localVariable");
const User = require("../../models/Users");
const OTP = require("../../models/Otp");

const router = express.Router();

router.use(localVariables);

router.get("/forgot/:email", async (req, res) => {
    try {
      let { email } = req.params;
      // Convert email to lowercase
      email = email.toLowerCase();
  
      const existingUser = await User.findOne({ email });
  
      if (!existingUser) {
        return res.status(400).json({ error: "Email not valid" });
      }
  
      //Generate OTP
      let otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });
  
      // Create or update OTP record in the database
      await OTP.findOneAndUpdate(
        { email },
        { email, otp },
        { upsert: true, new: true }
      );
  
      // Send OTP via email
      await sendOTP(email, otp);
      console.log("Generated OTP for email:", email, otp);
  
      res.status(200).json({ email, otp });
    } catch (error) {
      console.error("Error generating OTP:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

module.exports = router;
