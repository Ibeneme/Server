const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: String,
  groupId: String,
  msg: String,
  timestamp: { type: Date, default: Date.now },
  admin: String,
  sender: String,
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
