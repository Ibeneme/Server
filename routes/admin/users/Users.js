const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin/Admin");
const User = require("../../models/Users");

const router = express.Router();

// Register a new admin
// Helper function to get the date for a specific number of days ago
const getDateNDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Get statistics for users, providers, and financial transactions
router.get("/user-stats", async (req, res) => {
  try {
    // Calculate the time periods
    const timePeriods = {
      "24h": getDateNDaysAgo(1),
      "48h": getDateNDaysAgo(2),
      "72h": getDateNDaysAgo(3),
      "7days": getDateNDaysAgo(7),
      "1month": getDateNDaysAgo(30),
      "2months": getDateNDaysAgo(60),
      "3months": getDateNDaysAgo(90),
      "6months": getDateNDaysAgo(180),
      "1year": getDateNDaysAgo(365),
    };

    // Query the database for each time period
    const results = {};

    for (const [period, date] of Object.entries(timePeriods)) {
      const [
        newUsers,
        verifiedUsers,
        providers,
        subscriptionsCreated,
        communitySubscribed,
        totalWithdrawn,
        totalDeposited,
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: date } }), // New users
        User.countDocuments({ verified: true, createdAt: { $gte: date } }), // Verified users
        User.countDocuments({ provider: true, createdAt: { $gte: date } }), // Providers
        User.countDocuments({
          "createdSubscriptions.createdAt": { $gte: date },
        }), // Subscriptions created
        User.countDocuments({
          communitySubscribed: true,
          createdAt: { $gte: date },
        }), // Community subscribed users
        User.aggregate([
          { $match: { "withdrawnFunds.timestamp": { $gte: date } } },
          { $unwind: "$withdrawnFunds" },
          {
            $group: {
              _id: null,
              totalWithdrawn: { $sum: "$withdrawnFunds.amount" },
            },
          },
        ]), // Total amount withdrawn
        User.aggregate([
          { $match: { "deposits.timestamp": { $gte: date } } },
          { $unwind: "$deposits" },
          {
            $group: { _id: null, totalDeposited: { $sum: "$deposits.price" } },
          },
        ]), // Total amount deposited
      ]);

      results[period] = {
        newUsers,
        verifiedUsers,
        providers,
        subscriptionsCreated,
        communitySubscribed,
        totalWithdrawn:
          totalWithdrawn.length > 0 ? totalWithdrawn[0].totalWithdrawn : 0,
        totalDeposited:
          totalDeposited.length > 0 ? totalDeposited[0].totalDeposited : 0,
      };
    }

    // Return the results
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are providers
router.get("/providers", async (req, res) => {
  try {
    const providers = await User.find({ provider: true });
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
    });
    res.json(communitySubscribedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
