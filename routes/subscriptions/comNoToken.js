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
const ProTradersStatus = require("../../models/Providers/ProvidersCom");
const AcademyComStatus = require("../../models/Providers/AcademyCom");
const Subscription = require("../../models/Providers/Subscription");
const Status = require("../../models/Providers/Status");
const Post = require("../../models/Providers/Post");
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

router.get("/pro-trader", async (req, res) => {
  try {
    const statuses = await ProTradersStatus.find().sort({ createdAt: -1 }); // Sort by createdAt timestamp in descending order
    res.status(200).json({ statuses });
  } catch (error) {
    console.error("Error fetching statuses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/academy", async (req, res) => {
  try {
    const statuses = await AcademyComStatus.find().sort({ createdAt: -1 }); // Sort by createdAt timestamp in descending order
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
// Route to get all posts with specific fields
router.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the post by ID
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

router.get("/author/:authorId", async (req, res) => {
  const { authorId } = req.params;

  try {
    // Find all posts by the given author
    const posts = await Post.find({ author: authorId }).populate(
      "author",
      "firstName lastName"
    ); // Populating author's first and last name

    if (!posts.length) {
      return res
        .status(404)
        .json({ message: "No posts found for this author." });
    }

    // If the author has more than one post, return them all in an array
    res.status(200).json({
      authorId: authorId,
      posts: posts, // All posts by this author in an array
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

router.put("/:userId/:statusId/accept-reject", async (req, res) => {
  try {
    const { status } = req.body;
    const { userId, statusId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the status by ID
    const existingStatus = await Status.findById(statusId);
    if (!existingStatus) {
      return res.status(404).json({ error: "Status not found" });
    }

    // Update the status
    existingStatus.status = status;

    // Save the updated status
    await existingStatus.save();

    // Handle subscription logic based on status
    if (status === "accepted") {
      await handleAcceptedStatus(user, existingStatus);
    } else if (status === "pending" || status === "expired") {
      await handlePendingOrExpiredStatus(user, existingStatus);
    }

    res.status(202).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function handleAcceptedStatus(user, existingStatus) {
  try {
    const subscription = await Subscription.findById(
      existingStatus.subscriptionId
    );
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Add user to the list of subscribed users
    subscription.users.push({
      user: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      subscriptionDate: new Date(),
      expirationDate: new Date(
        Date.now() + subscription.durationInDays * 24 * 60 * 60 * 1000
      ),
      email: user.email,
      amountPaid: subscription.price,
      durationPaidFor: subscription.durationInDays,
    });

    // Save the updated subscription
    await subscription.save();
    // Find the user who created the subscription and update totalEarnings
    const subscriptionCreator = await User.findById(subscription.creator);
    if (!subscriptionCreator) {
      throw new Error("Subscription creator not found");
    }

    // Update totalEarnings of the subscription creator
    subscriptionCreator.totalEarnings += subscription.price;

    // Update totalEarnings of the user
    //user.totalEarnings += subscription.price;

    console.log(subscriptionCreator, "useruser");
    // Update earnings array with details of the earnings
    subscriptionCreator.earnings.push({
      amountEarned: subscription.price,
      subscriptionId: subscription._id,
      subscriptionTitle: subscription.title,
      subscriberFirstName: user.firstName,
      subscriberLastName: user.lastName,
      timestamp: new Date(),
      status: "accepted",
      durationIndays: subscription.durationInDays,
    });

    await subscriptionCreator.save();

    // Schedule expiration and reminder emails
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + subscription.durationInDays
    );

    // Send expiration notification
    sendSubscriptionStatusNotification(
      user,
      "Your subscription has expired.",
      expirationDate
    );

    // Set timeout to automatically mark subscription as expired
    setTimeout(async () => {
      subscription.status = "expired";
      await subscription.save();
    }, subscription.durationInDays * 24 * 60 * 60 * 1000);
  } catch (error) {
    console.error("Error handling accepted status:", error);
    throw error;
  }
}

async function handlePendingOrExpiredStatus(user, existingStatus) {
  try {
    const subscription = await Subscription.findById(
      existingStatus.subscriptionId
    );
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Remove user from the list of subscribed users
    subscription.users = subscription.users.filter(
      (subscribedUser) => subscribedUser.user.toString() !== user._id.toString()
    );

    // Save the updated subscription
    await subscription.save();
  } catch (error) {
    console.error("Error handling pending or expired status:", error);
    throw error;
  }
}

router.get("/user/pro-trader", async (req, res) => {
  try {
    // Assuming req.userId contains the user's ID
    const userId = req.user._id;

    //console.log(userId, "userId");
    // Find user statuses based on subscriberId and sort by createdAt timestamp in descending order
    const userStatuses = await ProTradersStatus.find({
      subscriberId: userId,
    }).sort({
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

router.get("/user/academy", async (req, res) => {
  try {
    // Assuming req.userId contains the user's ID
    const userId = req.user._id;

    //console.log(userId, "userId");
    // Find user statuses based on subscriberId and sort by createdAt timestamp in descending order
    const userStatuses = await AcademyComStatus.find({
      subscriberId: userId,
    }).sort({
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
router.post("/update-provider", async (req, res) => {
  const { userId } = req.body; // Extract userId from request body

  try {
    // Find the user by their ID
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the provider field to true
    user.provider = true;

    // Save the updated user information
    await user.save();

    // Send success response
    res.status(200).json({
      message: "Provider status updated successfully",
      user,
    });
  } catch (error) {
    // Send error response in case of any issues
    console.error(error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

router.post("/report", async (req, res) => {
  // const { id } = req.params; // Get user ID from URL
  const { report, id } = req.body; // Get report data from request body

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.reported.push({
      user: id,
      report,
    });
    await user.save();

    res.status(200).json({
      message: "Report added successfully",
      reported: user.reported,
    });
  } catch (error) {
    console.error("Error adding report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to get all reports
router.get("/reports", async (req, res) => {
  try {
    // Find all users who have made at least one report
    const usersWithReports = await User.find({
      "reported.0": { $exists: true },
    })
      .select("firstName lastName reported") // Select only relevant fields
      .populate("reported.user", "firstName lastName"); // Populate the reported user details

    if (!usersWithReports || usersWithReports.length === 0) {
      return res.status(404).json({ message: "No reports found" });
    }

    // Respond with the users and their reports
    res.status(200).json({
      message: "Reports retrieved successfully",
      usersWithReports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({ message: "Server error" });
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
      const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

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
      }, 10000000); // 30 days in milliseconds
    }

    if (status === "rejected") {
      user.communitySub = false;
      user.communitySubWaiting = false;
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

    // If status is accepted, schedule expiration and reminder emails
    if (status === "rejected") {
      user.communitySub = false;
      user.communitySubWaiting = false;
      await user.save();

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

router.post(
  "/:subscriberId/:status/protrader",
  upload.single("image"),
  async (req, res) => {
    try {
      const { status } = req.params;

      const durationInDays = 30;
      const price = 10;
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
      const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

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
      const newStatus = new ProTradersStatus(newStatusData);

      // Save the new status entry
      await newStatus.save();

      // Find the user associated with the subscription request
      const user = await User.findById(subscriberId);

      // Update the user's communitySubWaiting field to true
      user.proTraderSubWaiting = true;

      // If the subscription status is 'accepted', update proTraderSub field to true
      if (status === "accepted") {
        user.proTraderSub = true;

        // Schedule timeout to reset proTraderSub to false after 30 days
        setTimeout(async () => {
          user.proTraderSub = false;
          user.proTraderSubWaiting = false;
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

router.put("/:userId/:statusId/protrader", async (req, res) => {
  try {
    const { status } = req.body;
    const { userId, statusId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the status by ID
    const existingStatus = await ProTradersStatus.findById(statusId);
    if (!existingStatus) {
      return res.status(404).json({ error: "Status not found" });
    }

    // If the subscription status is 'accepted', update proTraderSub field to true
    if (status === "accepted") {
      user.proTraderSub = true;

      // Schedule timeout to reset proTraderSub to false after 30 days
      setTimeout(async () => {
        user.proTraderSub = false;
        user.proTraderSubWaiting = false;
        await user.save();
      }, 10000000); // 30 days in milliseconds
    }

    // If the subscription status is 'accepted', update proTraderSub field to true
    if (status === "rejected") {
      user.proTraderSub = false;
      user.proTraderSubWaiting = false;
      await user.save();
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
        user.proTraderSub = true;
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

router.post(
  "/:subscriberId/:status/academy",
  upload.single("image"),
  async (req, res) => {
    try {
      const { status } = req.params;

      const durationInDays = 30;
      const price = 3.5;
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
      const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

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
      const newStatus = new AcademyComStatus(newStatusData);

      // Save the new status entry
      await newStatus.save();

      // Find the user associated with the subscription request
      const user = await User.findById(subscriberId);

      // Update the user's communitySubWaiting field to true
      user.academySubWaiting = true;

      // If the subscription status is 'accepted', update academySub field to true
      if (status === "accepted") {
        user.academySub = true;

        // Schedule timeout to reset academySub to false after 30 days
        setTimeout(async () => {
          user.academySub = false;
          user.academySubWaiting = false;
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

router.put("/:userId/:statusId/academy", async (req, res) => {
  try {
    const { status } = req.body;
    const { userId, statusId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the status by ID
    const existingStatus = await AcademyComStatus.findById(statusId);
    if (!existingStatus) {
      return res.status(404).json({ error: "Status not found" });
    }
    // If the subscription status is 'accepted', update proTraderSub field to true
    if (status === "rejected") {
      user.academySub = false;
      user.academySubWaiting = false;
      await user.save();
    }

    // If the subscription status is 'accepted', update academySub field to true
    if (status === "accepted") {
      user.academySub = true;

      // Schedule timeout to reset academySub to false after 30 days
      setTimeout(async () => {
        user.academySub = false;
        user.academySubWaiting = false;
        await user.save();
      }, 10000000); // 30 days in milliseconds
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
        user.academySub = true;
        await user.save();
      }
    }

    res.status(202).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
