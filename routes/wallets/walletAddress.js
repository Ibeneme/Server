// routes/walletRoutes.js
const express = require("express");
const WalletAddresses = require("../../models/WalletAddresses");
const router = express.Router();

//const Wallet = require('../models/Wallet');
// Route to create a new wallet address


router.post("/", async (req, res) => {
  const { address, name } = req.body;

  if (!address || !name) {
    return res.status(400).json({ message: "Address and name are required" });
  }

  try {
    const newWallet = new WalletAddresses({ address, name });
    await newWallet.save();
    res.status(201).json(newWallet);
  } catch (err) {
    if (err.code === 11000) {
      res
        .status(400)
        .json({ message: "Wallet with this address or name already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// Route to get a specific wallet address by name
router.get("/:name", async (req, res) => {
  try {
    const wallet = await WalletAddresses.findOne({ name: req.params.name });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Route to get a specific wallet address by name
router.put("/:id", async (req, res) => {
  const { address, name } = req.body;

  try {
    const wallet = await WalletAddresses.findByIdAndUpdate(
      req.params.id,
      { address, name },
      { new: true, runValidators: true }
    );

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Route to get all wallet addresses
router.get("/", async (req, res) => {
  try {
    const wallets = await WalletAddresses.find();
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Route to delete a wallet address by ID
router.delete("/:id", async (req, res) => {
  try {
    const wallet = await WalletAddresses.findByIdAndDelete(req.params.id);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json({ message: "Wallet deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
