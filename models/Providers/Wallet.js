const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalBalance: {
    type: Number,
    required: true,
  },
  _id: mongoose.Schema.Types.ObjectId,
});

const Wallet = mongoose.model("Wallet", WalletSchema);

module.exports = Wallet;
