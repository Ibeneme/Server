const express = require("express");
const Post = require("../../models/Providers/Post");

const {
  sendPostNotificationEmail,
} = require("../../services/mailing/createPostMail");

const router = express.Router();

// Route to edit a post
router.put("/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Extract updated content from the request body
    const { content, images, title } = req.body;

    // Set the title to "Signal Update"
    // const title = "Signal Update";

    // Find the post by ID
    const post = await Post.findById(postId);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Update the post fields with the new data
    post.title = title;
    post.content = content;
    post.images = images;

    // Save the updated post to the database
    await post.save();

    const subscribedUsers = [
      { email: "ikennaibenemee@gmail.com" },
      { email: "ibenemeikenna96@gmail.com" },
    ];

    // Send email to all subscribers
    await sendPostNotificationEmail(subscribedUsers, post); // Pass subscribedUsers array and post object

    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
