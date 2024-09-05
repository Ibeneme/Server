const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const {
  sendPostJoinCommunityNotification,
} = require("../services/mailing/joinedCommunity");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middleware/auth");
const mongoose = require("mongoose");
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

router.post("/toggles-follow/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).send("Follower ID is required");
    }

    // Validate userId and followerId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(followerId)
    ) {
      return res.status(400).send("Invalid user or follower ID");
    }

    // Retrieve the user to follow and the follower
    const userToFollow = await User.findById(userId);
    const follower = await User.findById(followerId);

    if (!userToFollow || !follower) {
      return res.status(404).send("User not found");
    }

    // Ensure following is an array of ObjectId
    if (!Array.isArray(follower.following)) {
      follower.following = [];
    }

    const isFollowing = userToFollow.followers.includes(followerId);

    if (isFollowing) {
      // Unfollow
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== followerId
      );
      userToFollow.followersCount--;

      follower.following = follower.following.filter(
        (id) => id.toString() !== userId
      );

      console.log(
        `User ${follower.username} unfollowed ${userToFollow.username}`
      );
    } else {
      // Follow
      userToFollow.followers.push(followerId);
      userToFollow.followersCount++;

      // Push valid ObjectId
      if (!follower.following.includes(userId)) {
        follower.following.push(userId);
      }

      console.log(
        `User ${follower.username} followed ${userToFollow.username}`
      );
    }

    await userToFollow.save();
    await follower.save();

    res.status(200).json({
      following: !isFollowing,
      followersCount: userToFollow.followersCount,
    });
  } catch (error) {
    console.error("Error toggling follow:", error);
    res.status(500).send("Server error");
  }
});
router.post("/toggle-follow/:userId", async (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.body;

  try {
    // Fetch the followed user by userId
    const followedUser = await User.findById(userId);

    if (!followedUser) {
      return res.status(404).json({ message: "Followed user not found" });
    }

    // Fetch the follower by followerId
    const followerUser = await User.findById(followerId);

    if (!followerUser) {
      return res.status(404).json({ message: "Follower not found" });
    }

    // Check if followerId is already in the followed user's followers array
    const isFollowing = followedUser.followers.includes(followerId);

    if (isFollowing) {
      // If followerId exists, remove it and decrement the followers count
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: followerId },
        $inc: { followersCount: -1 },
      });

      // Remove the followed user's ID from the follower's freeCommunityFollowed array
      await User.findByIdAndUpdate(followerId, {
        $pull: { freeCommunityFollowed: userId },
      });
    } else {
      // If followerId does not exist, add it and increment the followers count
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followers: followerId },
        $inc: { followersCount: 1 },
      });

      // Add the followed user's ID to the follower's freeCommunityFollowed array
      await User.findByIdAndUpdate(followerId, {
        $addToSet: { freeCommunityFollowed: userId },
      });
    }

    // Respond with the updated followed user document
    const updatedFollowedUser = await User.findById(userId);
    res.status(200).json(updatedFollowedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to clear all items in the freeCommunityFollowed array for a specific user
router.post("/clear-free-community-followed/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear the freeCommunityFollowed array
    user.freeCommunityFollowed = [];

    // Save the updated user document
    await user.save();

    // Respond with a success message
    res
      .status(200)
      .json({ message: "freeCommunityFollowed array cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/free-community-followed/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the freeCommunityFollowed array
    res.status(200).json({ freeCommunityFollowed: user.freeCommunityFollowed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", (req, res) => {
  // Access the decoded token from the request object
  const user = req.user;
  // Now you have access to the user object
  res.json({ user });
});

router.get("/providers", async (req, res) => {
  try {
    // Query the User collection for users where provider and verified are both true
    const providers = await User.find({
      provider: true,
      verified: true,
    });
    // Return the fetched users as a response
    res.status(200).json(providers);
  } catch (error) {
    // Handle errors
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/toggle-community/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.communitySubscribed = true;
    await user.save();
    setTimeout(async () => {
      user.communitySubscribed = false;
      await user.save();
    }, 29 * 24 * 60 * 60 * 1000);
    await sendPostJoinCommunityNotification(user);
    res.json({ message: "User community status toggled to true" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
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
router.post("/withdraw", async (req, res) => {
  const { amount, recipientAddress } = req.body;
  const userId = req.user?._id;

  try {
    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert amount to a number if it's a string
    const parsedAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    // Optionally, convert totalWithdrawn to string if needed for response
    const totalWithdrawnString = user.totalWithdrawn.toString();

    console.log(totalWithdrawnString, "totalWithdrawnString");

    // Deduct amount from totalEarnings and add withdrawal
    user.totalEarnings -= parsedAmount;
    user.totalWithdrawn += parsedAmount;

    user.withdrawnFunds.push({
      amount: parsedAmount,
      recipientAddress,
      status: "pending", // Default status is pending
    });

    // Save updated user
    await user.save();

    res.status(200).json({
      message: "Withdrawal request submitted",
      totalWithdrawnString,
    });
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    res.status(500).json({ error: "Failed to withdraw funds" });
  }
});

// PUT route to update withdrawal status
router.put("/withdraw/:withdrawalId", async (req, res) => {
  const { withdrawalId } = req.params;
  const { status } = req.body;

  try {
    // Find the user by userId
    const user = await User.findOne({ "withdrawnFunds._id": withdrawalId });

    if (!user) {
      return res.status(404).json({ error: "User or withdrawal not found" });
    }

    // Find the withdrawal in user's withdrawnFunds array
    const withdrawal = user.withdrawnFunds.id(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    if (status === "rejected") {
      // Return the amount to user's totalEarnings
      user.totalEarnings += withdrawal.amount;
      user.totalWithdrawn += withdrawal.amount;
    }

    // Update withdrawal status
    withdrawal.status = status;

    // Save updated user
    await user.save();

    res.status(200).json({ message: "Withdrawal updated successfully" });
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    res.status(500).json({ error: "Failed to update withdrawal" });
  }
});

router.delete("/soft", async (req, res) => {
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

// DELETE route to completely delete user account
router.delete("/", async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user by ID and delete from the database
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/users/delete-all", async (req, res) => {
  try {
    // Using Mongoose to delete all documents in the 'users' collection
    await User.deleteMany({});
    res.status(200).json({ message: "All users deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete users", details: error.message });
  }
});

module.exports = router;
