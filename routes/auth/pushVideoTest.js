const B2 = require("backblaze-b2");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../../models/Users");

const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint for uploading profile photo or video
router.post("/", upload.single("file"), async (req, res) => {
  const userId = req.user._id; 
  try {
    console.log(req.file, "req.files");
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileBuffer = req.file.buffer;
    const fileName = `providers/${Date.now()}_${req.file.originalname.replace(
      /\s+/g,
      "_"
    )}`;

    await b2.authorize();

    const response = await b2.getUploadUrl({
      bucketId: "0e888bf37c0091f288e70619",
    });

    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: fileName,
      data: fileBuffer,
    });

    console.log(response, "uploadResponse");
    const bucketName = "trader-signal-app-v1";
    const uploadedFileName = uploadResponse.data.fileName;

    const fileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

    // Update user profile with file URL (photo or video)
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId }, // Finding user by ID
      { $set: { profilePhotoOrVideo: fileUrl } },
      { new: true }
    );

    console.log(updatedUser, 'updatedUser');

    // Send success response
    res.status(200).send({ message: "File Uploaded Successfully!" });
  } catch (error) {
    console.log("Error uploading file:", error);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
