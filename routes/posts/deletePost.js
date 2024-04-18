const express = require("express");
const Post = require("../../models/Providers/Post");

const router = express.Router();

// Route to delete a post
router.delete("/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Find the post by ID
    const post = await Post.findById(postId);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete the post from the database
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully", deletedPost: post });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
