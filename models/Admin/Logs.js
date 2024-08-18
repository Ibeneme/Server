const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  updateType: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Log", LogSchema);
