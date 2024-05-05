const express = require("express");
const User = require("../../models/Users");
const Community = require("../../models/Community");
const router = express.Router();

// Route to add a user to the community
router.post("/addUserToCommunity/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user information from the User schema
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract user information
    const { firstName, lastName } = user;

    // Create a new user entry in the community
    const newUser = {
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      isExpired: false,
      dateJoined: new Date(),
    };


    const community = await Community.findOneAndUpdate(
      {},
      { $push: { subscribedUsers: newUser } },
      { new: true }
    );

    setTimeout(
      async () => {
        await Community.findOneAndUpdate(
          {},
          { $pull: { subscribedUsers: { userId: userId } } }
        );
      },
      3000

      // * 24 * 60 * 60 * 1000
    ); // 30 days in milliseconds

    res
      .status(200)
      .json({ message: "User added to the community successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
