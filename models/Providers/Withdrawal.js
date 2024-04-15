const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema({
  requestId: mongoose.Schema.Types.ObjectId,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  recipientAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  time: {
    type: Date,
    default: Date.now,
  },
  timeApprovedOrFailed: {
    type: Date,
  },
});

const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);
module.exports = Withdrawal;
