const express = require("express");
const User = require("../../models/Users");

const router = express.Router();

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude the password field
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are providers
router.get("/providers", async (req, res) => {
  try {
    const providers = await User.find({ provider: true }).select("-password");
    res.json(providers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are community subscribed
router.get("/community-subscribed", async (req, res) => {
  try {
    const communitySubscribedUsers = await User.find({
      communitySubscribed: true,
    }).select("-password");
    res.json(communitySubscribedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who have communitySubFailed
router.get("/community-sub-failed", async (req, res) => {
  try {
    const communitySubFailedUsers = await User.find({
      communitySubFailed: true,
    }).select("-password");
    res.json(communitySubFailedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who have communitySubWaiting
router.get("/community-sub-waiting", async (req, res) => {
  try {
    const communitySubWaitingUsers = await User.find({
      communitySubWaiting: true,
    }).select("-password");
    res.json(communitySubWaitingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are verified
router.get("/verified", async (req, res) => {
  try {
    const verifiedUsers = await User.find({
      verified: true,
    }).select("-password");
    res.json(verifiedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get earnings and withdrawn funds for each user
router.get("/users-financials", async (req, res) => {
  try {
    const users = await User.find().select("-password").lean(); // Convert Mongoose documents to plain JavaScript objects
    const userFinancials = users.map((user) => ({
      ...user,
      totalAmountEarned: user.earnings.reduce(
        (sum, earning) => sum + earning.amountEarned,
        0
      ),
      totalAmountWithdrawn: user.withdrawnFunds.reduce(
        (sum, withdrawal) => sum + withdrawal.amount,
        0
      ),
    }));
    res.json(userFinancials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get only withdrawn funds for each user
router.get("/users-withdrawn-funds", async (req, res) => {
  try {
    const users = await User.find().select("username withdrawnFunds").lean(); // Only select username and withdrawnFunds
    const userWithdrawnFunds = users.map((user) => ({
      username: user.username,
      withdrawnFunds: user.withdrawnFunds,
      totalWithdrawn: user.withdrawnFunds.reduce(
        (sum, withdrawal) => sum + withdrawal.amount,
        0
      ),
    }));
    res.json(userWithdrawnFunds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get only earnings (amountEarned) for each user
router.get("/users-earnings", async (req, res) => {
  try {
    const users = await User.find().select("username earnings").lean(); // Only select username and earnings
    const userEarnings = users.map((user) => ({
      username: user.username,
      earnings: user.earnings,
      totalEarnings: user.earnings.reduce(
        (sum, earning) => sum + earning.amountEarned,
        0
      ),
    }));
    res.json(userEarnings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;