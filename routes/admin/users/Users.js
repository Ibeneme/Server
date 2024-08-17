const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin/Admin");
const User = require("../../models/Users");

const router = express.Router();

// Register a new admin

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
