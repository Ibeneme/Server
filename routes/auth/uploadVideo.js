const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../../models/Users");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log(req.file.buffer, " req.file.buffer");
    user.kyc = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };

    await user.save();

    return res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Internal Servesssr Error" });
  }
});

module.exports = router;
