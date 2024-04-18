const express = require("express");
const Post = require("../../models/Providers/Post");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const posts = await Post.find({ author: userId });
    console.log(userId, 'userId');
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts by user ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
