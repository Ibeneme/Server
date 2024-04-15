const express = require("express");
const Status = require("../../models/Providers/Status");
const Subscription = require("../../models/Providers/Subscription");
const User = require("../../models/Users");
const router = express.Router();
const B2 = require("backblaze-b2");
const multer = require("multer");

// Backblaze B2 credentials
const applicationKeyId = "e8b3c0128769";
const applicationKey = "005dc4424d6d6f2027ce61b07b1920a5e8e3bc1f03";

// Initialize Backblaze B2 client
const b2 = new B2({
  applicationKeyId: applicationKeyId,
  applicationKey: applicationKey,
});

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  try {
    const statuses = await Status.find().sort({ createdAt: -1 }); // Sort by createdAt timestamp in descending order
    res.status(200).json({ statuses });
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user", async (req, res) => {
  try {
    // Assuming req.userId contains the user's ID
    const userId = req.user._id;

    console.log(userId, "userId");
    // Find user statuses based on subscriberId and sort by createdAt timestamp in descending order
    const userStatuses = await Status.find({ subscriberId: userId }).sort({
      createdAt: -1,
    });

    // Check if user statuses were found
    if (!userStatuses) {
      return res.status(404).json({ error: "User statuses not found" });
    }

    // Return the user statuses
    res.status(200).json({ userStatuses });
  } catch (error) {
    console.error("Error fetching user statuses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//auth/users/660cb7f91eaf181546396624

// router.post(
//   "/:subscriberId/:durationInDays/:price/:subscriptionId/:status",
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const { subscriberId, durationInDays, price, subscriptionId, status } =
//         req.params;

//       // Check if the file is uploaded
//       if (!req.file || !req.file.buffer) {
//         return res.status(400).json({ error: "No file uploaded" });
//       }

//       // Additional data from request body
//       const { additionalData1, additionalData2 } = req.body;

//       // Process the image file (req.file) as needed
//       // For example, you can access the file buffer using req.file.buffer

//       // Additional processing based on parameters and request body
//       // You can handle the image upload and other data processing here

//       res.status(200).json({ message: "Request processed successfully" });
//     } catch (error) {
//       console.error("Error:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

//http://localhost:3002/api/v1/status/65fbfe7a368ef587cd2508fb/30/50/660012cd4ea553b2c0043636/pending
router.post(
  "/:subscriberId/:durationInDays/:price/:subscriptionId/:status/:title/:description",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        subscriberId,
        title,
        durationInDays,
        price,
        subscriptionId,
        status,
        description,
      } = req.params;

      const firstName = req.user.firstName;
      const lastName = req.user.lastName;

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileBuffer = req.file.buffer;
      const fileName = `payments/${Date.now()}_${req.file.originalname.replace(
        /\s+/g,
        "_"
      )}`;

      await b2.authorize();
      const response = await b2.getUploadUrl({
        bucketId: "0e888bf37c0091f288e70619", // Bucket ID to upload the file to
      });

      const uploadResponse = await b2.uploadFile({
        uploadUrl: response.data.uploadUrl,
        uploadAuthToken: response.data.authorizationToken,
        fileName: fileName,
        data: fileBuffer,
        title: title,

        //  description: description
      });
      const bucketName = "trader-signal-app-v1"; // Name of the bucket
      const uploadedFileName = uploadResponse.data.fileName;
      const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

      console.log(avatarUrl, "avatarUrl");
      const newStatusData = {
        durationInDays,
        price,
        imageProof: avatarUrl,
        subscriptionId,
        subscriberId,
        title,
        description,
        status: status || "pending",
        firstName,
        lastName,
      };

      // Check if the status is pending, rejected, or accepted
      if (
        newStatusData.status !== "pending" &&
        newStatusData.status !== "rejected" &&
        newStatusData.status !== "accepted"
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // If status is accepted, trigger further action
      if (newStatusData.status === "accepted") {
        console.log("Status is accepted, trigger further action...");
      }

      // Create a new status entry
      const newStatus = new Status(newStatusData);

      // Save the new status entry
      await newStatus.save();

      res
        .status(201)
        .json({ message: "Status created successfully", status: newStatus });
    } catch (error) {
      console.error("Error creating status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put("/:statusId", async (req, res) => {
  try {
    const { status } = req.body;
    const { statusId } = req.params;

    // Find the status by ID
    const existingStatus = await Status.findById(statusId);
    if (!existingStatus) {
      return res.status(404).json({ error: "Status not found" });
    }

    console.log(existingStatus, " existingStatus");
    // Update the status
    existingStatus.status = status;

    // Save the updated status
    await existingStatus.save();

    // If status is rejected, return a rejection message
    if (status === "rejected") {
      return res
        .status(200)
        .json({ message: "User is rejected from this subscription" });
    }

    // If status is accepted, continue with subscription process
    if (existingStatus && status === "accepted") {
      // Fetch all the details of the status
      const updatedStatus = await Status.findById(statusId);

      const subscription = await Subscription.findById(
        existingStatus?.subscriptionId
      );

      const subscriptionPrice = subscription.price;

      // Calculate the amount to be paid (you may add padding or other calculations here)
      const amountPaid = subscriptionPrice; // For now, just use the subscription price
      if (isNaN(amountPaid) || amountPaid <= 0) {
        return res
          .status(400)
          .json({ error: "Amount paid must be a positive number" });
      }

      // Find the user by ID
      const user = await User.findById(existingStatus?.subscriberId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { firstName, profilePhoto, lastName } = user;

      const isSubscribed = subscription.users.some(
        (subscriber) =>
          subscriber.user.toString() === existingStatus.subscriberId
      );
      if (isSubscribed) {
        return res
          .status(400)
          .json({ error: "User is already subscribed to this subscription" });
      }
      console.log(isSubscribed, "subscriptionId");
      // Calculate subscription expiration date based on current date and duration in days
      const expirationDate = new Date();
      expirationDate.setDate(
        expirationDate.getDate() + subscription.durationInDays
      );

      // Create a new subscription entry for the user
      const newSubscriptionEntry = {
        user: userId,
        firstName: firstName,
        lastName: lastName,
        profilePhoto: profilePhoto,
        subscriptionDate: new Date(),
        expirationDate: expirationDate,
        isRenew: null,
        amountPaid: existingStatus?.price,
        durationPaidFor: existingStatus?.durationInDays,
        subscriptionId: existingStatus.subscriptionId,
      };

      try {
        subscription.users.push(newSubscriptionEntry);
        await subscription.save();
        console.log("Subscription saved successfully");
      } catch (error) {
        console.error("Error saving subscription:", error);
        // Handle the error appropriately (e.g., return an error response to the client)
      }

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
    }

    res
      .status(202)
      .json({ message: "User joined the subscription successfully" });

    res
      .status(200)
      .json({ message: "Status updated successfully", status: updatedStatus });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
