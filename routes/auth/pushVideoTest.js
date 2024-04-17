const B2 = require("../../../OTI-BACKEND-SERVER/node_modules/backblaze-b2");
const express = require("../../../OTI-BACKEND-SERVER/node_modules/express");
const router = express.Router();
const multer = require("../../../OTI-BACKEND-SERVER/node_modules/multer");
const User = require("../../models/Users");
//const upload = require("./multer");

const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
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
      bucketId: "y0e888bf37c0091f288e70619",
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
