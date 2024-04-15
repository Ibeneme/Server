

const User = require("../models/Users");


const express = require("express");
const router = express.Router();
//Route to get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/profile", (req, res) => {
  // Access the decoded token from the request object
  const user = req.user;
  // Now you have access to the user object
  res.json({ user });
});

router.get('/providers', async (req, res) => {
  try {
    // Query the User collection for users with provider set to true
    const providers = await User.find({ provider: true });

    // Return the fetched users as a response
    res.status(200).json(providers);
  } catch (error) {
    // Handle errors
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(req.params, "req.params");
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/logout", (req, res) => {
  try {
    // Assuming you are using session-based authentication
    // Destroy the session or clear the session data
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.status(500).send("Internal Server Error");
      } else {
        res.status(200).json({ message: "Logout successful" });
      }
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/", async (req, res) => {
  try {
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { deleted: true } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Account soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting account:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
