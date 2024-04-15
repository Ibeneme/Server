const express = require("express");
const User = require("../models/Users");
const authMiddleware = require("../middleware/auth"); // Import the authMiddleware
const bcrypt = require("bcrypt");
const router = express.Router();

router.put("/", async (req, res) => {
  const userEmail = req.user.email; // Extracting the user email from the token

  try {
    if (!userEmail) {
      return res
        .status(400)
        .send({ error: "User email is missing from the token" });
    }
    const updates = req.body;
    console.log(updates, "updates");
    if (updates.firstName) {
      updates.firstName =
        updates.firstName.charAt(0).toUpperCase() +
        updates.firstName.slice(1).toLowerCase();
    }
    if (updates.lastName) {
      updates.lastName =
        updates.lastName.charAt(0).toUpperCase() +
        updates.lastName.slice(1).toLowerCase();
    }

    // Convert email to lowercase
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      updates,
      {
        new: true,
        maxTimeMS: 20000, // 20 seconds timeout
      }
    );

    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    // Send success message along with the updated user
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle password update
// Route to handle password update
router.put("/password", async (req, res) => {
  const userEmail = req.user.email;
  const { oldPassword, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the old password
    if (user.password !== oldPassword) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    // Send success message
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("Internal Server Error");
  }
});



module.exports = router;
