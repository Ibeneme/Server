const mongoose = require("mongoose");

// Define the schema for proTrader chat messages
const proTraderChatSchema = new mongoose.Schema({
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

const ProTraderChat = mongoose.model("ProTraderChat", proTraderChatSchema);

module.exports = ProTraderChat;
