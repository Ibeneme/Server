const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  groupId: { type: String, default: null },
  msg: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  admin: { type: String, default: null },
  sender: { type: String, default: null },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
