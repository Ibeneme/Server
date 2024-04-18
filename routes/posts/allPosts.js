const express = require("express");
const Post = require("../../models/Providers/Post");

const router = express.Router();

// Route to get all posts
router.get("/", async (req, res) => {
  try {
    // Fetch all posts from the database
    const posts = await Post.find();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
