
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const express = require("express");
const genAuthToken = require("../utils/genAuthToken");
const User = require("../models/Users");
const bcrypt = require("bcrypt");
const router = express.Router();

const validate = require("crypto-address-validators"); // Import validate function using CommonJS syntax

router.get("/", (req, res) => {
  // Parse currency and address from request parameters

  // Validate the address
  const isValid = validate("1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck", "btc");

  // Send response based on validation result
  if (isValid) {
    res.status(200).json({ message: "Valid address" });
  } else {
    res.status(400).json({ message: "Invalid address" });
  }
});

router.post("/", async (req, res) => {
  const schema = Joi.object({
    //name: Joi.string().min(3).max(30).required(),
    firstName: Joi.string().min(3).max(30).required(),
    lastName: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).max(200).required(),
    email: Joi.string().min(6).max(30).required(),
    provider: Joi.boolean().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  console.log(error);
  let user = await User.findOne({ email: req.body.email.toLowerCase() }); // Convert email to lowercase before querying

  if (user) return res.status(400).send("User already exists.");

  user = new User({
    //phoneNumber: req.body.phoneNumber,
    password: req.body.password,
    email: req.body.email.toLowerCase(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    provider: req.body.provider,
    balance: { user: null },
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = genAuthToken(user);
  res.send(token);
});

module.exports = router;
