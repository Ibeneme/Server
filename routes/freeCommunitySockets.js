// routes/freeCommunitySockets.js

const express = require("express");
const FreeCommunityMessage = require("../models/FreeCommunityMessage");
const router = express.Router();

// Route to get all freeCommunitySockets messages
router.get('/:freeCommunityId', async (req, res) => {
  const { freeCommunityId } = req.params;

  try {
    const communityMessages = await FreeCommunityMessage.findOne({ freeCommunityId }).populate('messages.sender', 'name email');
    if (!communityMessages) {
      return res.status(404).json({ message: 'No messages found for this community' });
    }
    res.status(200).json(communityMessages.messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;
