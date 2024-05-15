const express = require("express");
const User = require("../../models/Users");
const router = express.Router();
const B2 = require("backblaze-b2");
const multer = require("multer");
const {
  sendSubscriptionRequestConfirmation,
} = require("../../services/mailing/joinedSub");
const {
  sendSubscriptionStatusNotification,
} = require("../../services/mailing/subNotifications");
const ComStatus = require("../../models/Providers/ComStatus");
const YOUR_THRESHOLD_VALUE = 30; // Define your threshold value here

// Backblaze B2 credentials

// Initialize Backblaze B2 client
const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

// Multer storage configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  try {
    const statuses = await ComStatus.find().sort({ createdAt: -1 }); // Sort by createdAt timestamp in descending order
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
    const userStatuses = await ComStatus.find({ subscriberId: userId }).sort({
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
//65fbfe7a368ef587cd2508fb
//auth/users/660cb7f91eaf181546396624

// router.post(
//   "/:subscriberId/:durationInDays/:price/:status",
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       const { subscriberId, durationInDays, price, status } =
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
  "/:subscriberId/:status/",
  upload.single("image"),
  async (req, res) => {
    try {
      const { status } = req.params;

      const durationInDays = 30;
      const price = 1;
      const subscriberId = req.user?._id;

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
      });
      const bucketName = "trader-signal-app-v1"; // Name of the bucket
      const uploadedFileName = uploadResponse.data.fileName;
      const avatarUrl = `https://f005.backblazeb2.com/file/subscriptionstatus${bucketName}/${uploadedFileName}`;

      console.log(avatarUrl, "avatarUrl");
      const newStatusData = {
        durationInDays,
        price,
        imageProof: avatarUrl,
        subscriberId,
        status: status || "pending",
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      };

      // Check if the status is pending, rejected, accepted, or expired
      if (
        newStatusData.status !== "pending" &&
        newStatusData.status !== "rejected" &&
        newStatusData.status !== "accepted" &&
        newStatusData.status !== "expired"
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // If status is accepted, trigger further action
      if (newStatusData.status === "accepted") {
        console.log("Status is accepted, trigger further action...");
        // Your further action here...
      }

      // Create a new status entry
      const newStatus = new ComStatus(newStatusData);

      // Save the new status entry
      await newStatus.save();

      // Find the user associated with the subscription request
      const user = await User.findById(subscriberId);

      // Update the user's communitySubWaiting field to true
      user.communitySubWaiting = true;

      // If the subscription status is 'accepted', update communitySub field to true
      if (status === "accepted") {
        user.communitySub = true;

        // Schedule timeout to reset communitySub to false after 30 days
        setTimeout(async () => {
          user.communitySub = false;
          user.communitySubWaiting = false;
          await user.save();
        }, 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
      }

      // Save the updated user
      await user.save();

      // Check if durationInDays is a number and greater than a certain value
      const duration = parseInt(durationInDays);

      // http://localhost:3002/api/v1/posts/create/66129a5f76c8a7bfe168f571
      res
        .status(201)
        .json({ message: "Status created successfully", status: newStatus });
    } catch (error) {
      console.error("Error creating status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put("/:userId/:statusId", async (req, res) => {
  try {
    const { status } = req.body;
    const { userId, statusId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the status by ID
    const existingStatus = await ComStatus.findById(statusId);
    if (!existingStatus) {
      return res.status(404).json({ error: "Status not found" });
    }

     // If the subscription status is 'accepted', update communitySub field to true
     if (status === "accepted") {
      user.communitySub = true;

      // Schedule timeout to reset communitySub to false after 30 days
      setTimeout(async () => {
        user.communitySub = false;
        user.communitySubWaiting = false;
        await user.save();
      }, 10000000 ); // 30 days in milliseconds
    }

    // Update the status
    existingStatus.status = status;

    const durationInDays = 30 * 24 * 60 * 60 * 1000;
    // Save the updated status
    await existingStatus.save();

    // Send notification email based on status
    await sendSubscriptionStatusNotification(user, status, durationInDays);

    // If status is accepted, schedule expiration and reminder emails
    if (status === "accepted") {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + durationInDays);

      // Schedule expiration email
      sendSubscriptionStatusNotification(
        user,
        "Your subscription has expired.",
        expirationDate
      );

      // Schedule reminder emails
      const fiveDaysBeforeExpiration = new Date(expirationDate);
      fiveDaysBeforeExpiration.setDate(fiveDaysBeforeExpiration.getDate() - 5);
      sendSubscriptionStatusNotification(
        user,
        "Your subscription is expiring in 5 days. Please renew to continue accessing our services.",
        fiveDaysBeforeExpiration
      );

      const threeDaysBeforeExpiration = new Date(expirationDate);
      threeDaysBeforeExpiration.setDate(
        threeDaysBeforeExpiration.getDate() - 3
      );
      sendSubscriptionStatusNotification(
        user,
        "Your subscription is expiring in 3 days. Please renew to continue accessing our services.",
        threeDaysBeforeExpiration
      );

      const oneDayBeforeExpiration = new Date(expirationDate);
      oneDayBeforeExpiration.setDate(oneDayBeforeExpiration.getDate() - 1);
      sendSubscriptionStatusNotification(
        user,
        "Your subscription is expiring tomorrow. Please renew to continue accessing our services.",
        oneDayBeforeExpiration
      );
      if (status === "accepted") {
        user.communitySub = true;
        await user.save();
      }

      // setTimeout(async () => {
      //   existingStatus.isExpired = true;
      //   existingStatus.status = "expired";
      //   await existingStatus.save();
      // }, 30 * 24 * 60 * 60 * 1000);
      // Set timeout to reset communitySub to false after 30 days
      // setTimeout(async () => {
      //   user.communitySub = false;
      //   await user.save();
      // }, 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
    }

    res.status(202).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
