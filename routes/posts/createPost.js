const express = require("express");
const Post = require("../../models/Providers/Post");
const Subscription = require("../../models/Providers/Subscription");
const {
  sendPostNotificationEmail,
} = require("../../services/mailing/createPostMail");
const mongoose = require("mongoose");
const router = express.Router();
const B2 = require("backblaze-b2");
const multer = require("multer");

const b2 = new B2({
  applicationKeyId: process.env.applicationKeyId,
  applicationKey: process.env.applicationKey,
});

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// // Route to create a new post
router.post("/:subscriptionId", upload.single("images"), async (req, res) => {
  try {
    const { content, title, tp1, tp2, tp3, tp4, tp5, sl, pair } = req.body;
    const { subscriptionId } = req.params;
    const { _id, firstName, lastName } = req.user;
    console.log(firstName, lastName, "firstName, lastName}");
    const userEmail = req.user.email;

    // Check if file is uploaded
    let avatarUrl = null;
    if (req.file && req.file.buffer) {
      // Extract file data
      const fileBuffer = req.file.buffer;
      const fileName = `providers/posts/${Date.now()}_${req.file.originalname.replace(
        /\s+/g,
        "_"
      )}`;

      // Authorize with Backblaze B2
      await b2.authorize();

      // Get upload URL from B2
      const response = await b2.getUploadUrl({
        bucketId: process.env.bucketId, // Bucket ID to upload the file to
      });

      const uploadResponse = await b2.uploadFile({
        uploadUrl: response.data.uploadUrl,
        uploadAuthToken: response.data.authorizationToken,
        fileName: fileName,
        data: fileBuffer,
      });

      // Construct avatar URL from uploaded file information
      const bucketName = process.env.bucketName; // Name of the bucket
      const uploadedFileName = uploadResponse.data.fileName;
      avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
    }

    console.log(_id, "userId");
    const subscribedUsers = []; // Initialize empty array for subscribed users

    // Validate the subscription ID
    if (!mongoose.isValidObjectId(subscriptionId)) {
      return res.status(400).json({ error: "Invalid subscription ID" });
    }

    // Create a new post associated with the subscription
    const post = new Post({
      title,
      tp1: tp1,
      tp2: tp2,
      tp3: tp3,
      tp4: tp4,
      tp5: tp5,
      sl: sl,
      pair: pair,
      content,
      images: avatarUrl, // Assign null if no file uploaded
      authorFirstName: firstName,
      authorLastName: lastName,
      author: _id,
      subscriptionId: subscriptionId,
    });

    // Save the post to the database
    await post.save();

    // Send email notification to all subscribed users
    await sendPostNotificationEmail(subscribedUsers, post);

    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // Sort by createdAt timestamp in descending order

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get all posts by a user
router.get("/user/", async (req, res) => {
  try {
    const { _id } = req.user;

    const userId = _id;
    // Validate the user ID
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userPosts = await Post.find({ author: userId }).sort({
      createdAt: -1,
    }); // Sort by createdAt timestamp in descending order

    res.status(200).json(userPosts);
  } catch (error) {
    console.error("Error getting user posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/subscription/:subscriptionId", async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Validate the subscription ID
    if (!mongoose.isValidObjectId(subscriptionId)) {
      return res.status(400).json({ error: "Invalid subscription ID" });
    }

    const posts = await Post.find({ subscriptionId }).sort({ createdAt: -1 }); // Sort by createdAt timestamp in descending order

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error getting posts by subscription ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to delete a post
router.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate the post ID
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Find the post by ID and delete it
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to edit a post
router.put("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    // Validate the post ID
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Find the post by ID and update its title and content
    await Post.findByIdAndUpdate(postId, { title, content });

    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
