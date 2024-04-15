const B2 = require("backblaze-b2");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const User = require("../../models/Users");
//const upload = require("./multer");

const b2 = new B2({
  applicationKeyId: process.env.applicationKeyId,
  applicationKey: process.env.applicationKey,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/:userId", upload.single("file"), async (req, res) => {
  const userId = req.params.userId;
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
      bucketId: process.env.bucketId,
    });

    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: fileName,
      data: fileBuffer,
    });

    console.log(response, "uploadResponse");
    const bucketName = process.env.bucketName;
    const uploadedFileName = uploadResponse.data.fileName;

    const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

    console.log(avatarUrl, "avatarUrl");

    res.status(200).send({ message: "Photo Uploaded Successfully!" });
  } catch (error) {
    console.log("Error uploading file:", error);
    res
      .status(500)
      .send({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
