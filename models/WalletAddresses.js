// models/Wallet.js
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  address: { type: String, required: true },
  name: { type: String, required: true },
});

const WalletAddresses = mongoose.model("WalletAddresses", walletSchema);

module.exports = WalletAddresses;
