const express = require("express");
const CommunityChat = require("../../models/CommunityChat");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const messages = await CommunityChat.find();
    res.json(messages);
  } catch (error) {
    console.error("Error getting community chat messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, firstName, lastName, message } = req.body;
    const newMessage = new CommunityChat({
      userId,
      firstName,
      lastName,
      message,
    });
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error adding message to community chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
