const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../../models/Users");

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLowercased = email.toLowerCase(); // Corrected variable name

    if (!emailLowercased || !password) {
      return res
        .status(400)
        .json({ error: "Email and new password are required" });
    }

    console.log(emailLowercased, 'jj');
    const user = await User.findOne({ email: emailLowercased }); // Corrected property name
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
