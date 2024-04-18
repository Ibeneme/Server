const express = require("express");
const Post = require("../../models/Providers/Post");
const mongoose = require("mongoose");

const router = express.Router();

// Route to edit a comment
router.put("/:postId/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Find the comment by ID
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Update the content of the comment
    comment.content = content;

    // Save the updated post
    await post.save();

    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to delete a comment
router.delete("/:postId/:commentId", async (req, res) => {
    try {
      const { postId, commentId } = req.params;
  
      // Find the post by ID
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
  
      // Filter out the comment to be deleted
      post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
  
      // Save the updated post (comment is automatically removed from post)
      await post.save();
  
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  

module.exports = router;
