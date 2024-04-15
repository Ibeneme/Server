const express = require("express");
const User = require("../models/Users");

const router = express.Router();

router.get("/", async (req, res) => {
  const { name } = req.params;
  console.log(name, "user");
  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ error: "User not foundss", name });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
