const express = require("express");
const Post = require("../../models/Providers/Post");
const User = require("../../models/Users");

const router = express.Router();

router.post("/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const { userId, content } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
   const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
   const newComment = {
      user: userId,
      content: content,
    };
    post.comments.push(newComment);
    await post.save();
    res.status(201).json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
