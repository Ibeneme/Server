const B2 = require("backblaze-b2");
const express = require("express");
const multer = require("multer");
const User = require("../../models/Users");

const router = express.Router();

// Initialize Backblaze B2 client
const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST endpoint for uploading profile photo

router.put("/", upload.single("file"), async (req, res) => {
  try {
    // Extract user email from request parameters
    const userEmail = req.user.email; // Assuming userEmail is the property that holds the user email in the token

    // Check if file is uploaded
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileBuffer = req.file.buffer;
    console.log(userEmail, fileBuffer, req.file); // There is a typo here, it should be req.file instead of file
    // Extract file data

    const fileName = `providers/${Date.now()}_${req.file.originalname.replace(
      /\s+/g,
      "_"
    )}`;

    // Authorize with Backblaze B2
    await b2.authorize();

    // Get upload URL from B2
    const response = await b2.getUploadUrl({
      bucketId: "0e888bf37c0091f288e70619", // Bucket ID to upload the file to
    });

    // Upload file to B2
    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: fileName,
      data: fileBuffer,
    });

    console.log(uploadResponse, "uploadResponse");
    // Construct avatar URL from uploaded file information
    const bucketName = "trader-signal-app-v1"; // Name of the bucket
    const uploadedFileName = uploadResponse.data.fileName;
    const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

    // Update user profile with avatar URL
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail }, // Finding user by email
      { $set: { profilePhoto: avatarUrl } },
      { new: true }
    ).select("-password -token");

    console.log(updatedUser, "updatedUser");
    // Check if user is found
    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    // Send success response
    res
      .status(200)
      .send({ message: "Photo Uploaded Successfully!", user: updatedUser });
  } catch (error) {
    // Handle errors
    console.log("Error uploading file:", error);
    res
      .status(500)
      .send({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
