const express = require("express");
const WaitingListUser = require("../../models/waitingList/WaitingListUser");
const router = express.Router();

router.post("/:email", async (req, res) => {
  try {
    const { fullName } = req.body;
    const { email } = req.params;

    console.log(email, "email", fullName, "fullName");
    if (!fullName || !email) {
      return res
        .status(400)
        .json({ message: "Full name and email are required." });
    }

    const existingUser = await WaitingListUser.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email already exists in the waiting list." });
    }

    const newUser = new WaitingListUser({ fullName, email });
    await newUser.save();

    res
      .status(201)
      .json({ message: "Successfully added to the waiting list." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/", async (req, res) => {
  try {
    const waitingUsers = await WaitingListUser.find();
    res.json(waitingUsers); // Send the waiting users as JSON response
  } catch (error) {
    console.error("Error fetching waiting users:", error);
    res.status(500).json({ error: "Internal server error" }); // Send error response
  }
});

module.exports = router;
