const express = require("express");
const router = express.Router();
const Subscription = require("../models/Subscription");

// Get all subscriptions
router.get("/", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (error) {
    console.error("Error retrieving subscriptions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a subscription
router.post("/", async (req, res) => {
  try {
    const subscription = new Subscription(req.body);
    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get a specific subscription by ID
router.get("/:subscriptionId", async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json(subscription);
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a subscription by ID
router.put("/:subscriptionId", async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(req.params.subscriptionId, req.body, { new: true });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json(subscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a subscription by ID
router.delete("/:subscriptionId", async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Join a subscription by subscription ID
router.post("join/:subscriptionId/", async (req, res) => {
  try {
    // Implement joining subscription logic here
  } catch (error) {
    console.error("Error joining subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Leave a subscription by subscription ID
router.post("/leave/:subscriptionId/", async (req, res) => {
  try {
    // Implement leaving subscription logic here
  } catch (error) {
    console.error("Error leaving subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all users in a subscription by subscription ID
router.get("/users-sub/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    console.log(subscriptionId, 'subscriptionIdsubscriptionId')
    const subscription = await Subscription.findById(subscriptionId).populate("users.user");
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    res.json(subscription.users);
  } catch (error) {
    console.error("Error retrieving users in subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all posts in a subscription by subscription ID
router.get("posts/:subscriptionId/", async (req, res) => {
  try {
    // Implement getting all posts in a subscription logic here
  } catch (error) {
    console.error("Error retrieving posts in subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a post in a subscription by subscription ID
router.post("/:subscriptionId/posts", async (req, res) => {
  try {
    // Implement creating a post in a subscription logic here
  } catch (error) {
    console.error("Error creating post in subscription:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all users' subscriptions
router.get("/users/:userId/subscriptions", async (req, res) => {
  try {
    // Implement getting all users' subscriptions logic here
  } catch (error) {
    console.error("Error retrieving users' subscriptions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all subscriptions created by a user by user ID
router.get("/users/:userId/created-subscriptions", async (req, res) => {
  try {
    // Implement getting all subscriptions created by a user logic here
  } catch (error) {
    console.error("Error retrieving user's created subscriptions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
