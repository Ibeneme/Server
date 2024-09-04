const bcrypt = require("bcrypt");
const Joi = require("joi");
const express = require("express");
const genAuthToken = require("../utils/genAuthToken");
const User = require("../models/Users");
const router = express.Router();

router.post("/", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().min(3).max(200).required().email(),
    password: Joi.string().min(6).max(200).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const email = req.body.email.toLowerCase().trim();
  const password = req.body.password;

  let user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid email or password");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).send("Invalid email or password");

  if (user && isValid) {
    const token = genAuthToken(user);
    return res.status(200).send({ token, user });
  }
});

module.exports = router;
