// Import necessary modules
const express = require("express");
const Message = require("../models/Message");
const Post = require("../models/Providers/Post");
const router = express.Router();

// GET /api/messages/user/:userId/posts/:postId
router.get("/:userId/:postId", async (req, res) => {
  const { userId, postId } = req.params;
  try {
    const messages = await Message.find({ userId, postId })
      .sort({ createdAt: -1 }) // Sort by creation time (descending)
      .populate("userDetails"); // Optionally populate user details

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});
router.get("/:groupId", (req, res) => {
  const postId = req.params.groupId;
  ("nexttt");
  console.log(postId);
  Post.findById(postId)
    .populate("comments.user")
    .then((post) => {
      if (!post) {
        return res.status(404).send("Post not found");
      }
      console.log(post.comments, "post.comments");
      res.json(post.comments);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error fetching comments");
    });
});

// Define route handler for GET /messages/:groupId
// router.get("/:groupId", async (req, res) => {
//   const { groupId } = req.params;
//   //console.log(groupId, "groupId");
//   try {
//     // Find messages for the specified groupId, sort by timestamp
//     const previousMessages = await Message.find({ groupId })
//       .sort({
//         timestamp: 1,
//       })
//       .lean(); // Use lean() to retrieve plain JavaScript objects instead of Mongoose documents

//     if (previousMessages.length === 0) {
//       return res.status(455).json({ message: "No messages found" });
//     } else {
//       res.json(previousMessages);
//     }
//     // Send the previous messages as JSON response
//     // console.log(previousMessages, "previousMessages");
//   } catch (error) {
//     //console.error("Error fetching previous messages:", error);
//     res.status(500).json({ error: "Internal Server Error" }); // Send error response if any
//   }
// });

module.exports = router; // Export the router
