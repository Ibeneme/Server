const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose"); // Import Mongoose

const Post = require("../../models/Providers/Post");
const Subscription = require("../../models/Providers/Subscription"); // Import Subscription model
const {
  sendPostNotificationEmail,
} = require("../../services/mailing/createPostMail");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // Save uploaded images to 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file to include timestamp
  },
});
const upload = multer({ storage: storage });

// Route to create a new post
router.post("/:subscriptionId", async (req, res) => {
  try {
    const { title, content } = req.body;
    const { subscriptionId } = req.params;
    const { userId, firstName, lastName } = req.user; // Extract user information from the request object

    console.log("Received subscriptionId:", subscriptionId); // Log the subscriptionId

    // Validate ObjectId
    if (!mongoose.isValidObjectId(subscriptionId)) {
      return res.status(400).json({ error: "Invalid subscriptionId" });
    }

   const subscription = await Subscription.findOne({ _id: subscriptionId });

    console.log("Found subscription:", subscription); // Log the subscription

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Check if the user is the creator of the subscription
    if (userId !== subscription.creator.toString()) {
      return res.status(403).json({
        error: "Unauthorized: User is not the creator of the subscription",
      });
    }

    // Extract email addresses of subscribed users
    const subscribedUsers = subscription.users.map((user) => user.email);

    if (subscribedUsers.length === 0) {
      return res.status(400).json({ error: "No subscribed users found" });
    }

    // Create new post
    let images = [];
    if (req.files) {
      images = req.files.map((file) => file.path);
    }
    const post = new Post({
      title,
      content,
      images,
      author: {
        id: userId,
        firstName,
        lastName,
      },
    });

    await post.save();

    // Send email to all subscribers
    await sendPostNotificationEmail(subscribedUsers, post);

    res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
