const mongoose = require("mongoose");

// Define the schema for community chat messages
const communityChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  firstName: String,
  lastName: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const CommunityChat = mongoose.model("CommunityChat", communityChatSchema);

module.exports = CommunityChat;
