const express = require("express");
const User = require("../../models/Users");
const Status = require("../../models/Providers/Status");
const Course = require("../../models/Providers/Courses");
const ComStatus = require("../../models/Providers/ComStatus");
const Subscription = require("../../models/Providers/Subscription");
const logUpdate = require("../../middleware/logging");

const router = express.Router();

const getDateNDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Get statistics for users, providers, and financial transactions
router.get("/user-stats", async (req, res) => {
  try {
    // Calculate the time periods
    const timePeriods = {
      "24h": getDateNDaysAgo(1),
      "48h": getDateNDaysAgo(2),
      "72h": getDateNDaysAgo(3),
      "7days": getDateNDaysAgo(7),
      "1month": getDateNDaysAgo(30),
      "2months": getDateNDaysAgo(60),
      "3months": getDateNDaysAgo(90),
      "6months": getDateNDaysAgo(180),
      "1year": getDateNDaysAgo(365),
    };

    // Query the database for each time period
    const results = {};

    for (const [period, date] of Object.entries(timePeriods)) {
      const [
        newUsers,
        verifiedUsers,
        providers,
        subscriptionsCreated,
        communitySubscribed,
        totalWithdrawn,
        totalDeposited,
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: date } }), // New users
        User.countDocuments({ verified: true, createdAt: { $gte: date } }), // Verified users
        User.countDocuments({ provider: true, createdAt: { $gte: date } }), // Providers
        User.countDocuments({
          "createdSubscriptions.createdAt": { $gte: date },
        }), // Subscriptions created
        User.countDocuments({
          communitySubscribed: true,
          createdAt: { $gte: date },
        }), // Community subscribed users
        User.aggregate([
          { $match: { "withdrawnFunds.timestamp": { $gte: date } } },
          { $unwind: "$withdrawnFunds" },
          {
            $group: {
              _id: null,
              totalWithdrawn: { $sum: "$withdrawnFunds.amount" },
            },
          },
        ]), // Total amount withdrawn
        User.aggregate([
          { $match: { "deposits.timestamp": { $gte: date } } },
          { $unwind: "$deposits" },
          {
            $group: { _id: null, totalDeposited: { $sum: "$deposits.price" } },
          },
        ]), // Total amount deposited
      ]);

      results[period] = {
        newUsers,
        verifiedUsers,
        providers,
        subscriptionsCreated,
        communitySubscribed,
        totalWithdrawn:
          totalWithdrawn.length > 0 ? totalWithdrawn[0].totalWithdrawn : 0,
        totalDeposited:
          totalDeposited.length > 0 ? totalDeposited[0].totalDeposited : 0,
      };
    }

    // Return the results
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude the password field
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are providers
router.get("/providers", async (req, res) => {
  try {
    const providers = await User.find({ provider: true }).select("-password");
    res.json(providers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are community subscribed
router.get("/community-subscribed", async (req, res) => {
  try {
    const communitySubscribedUsers = await User.find({
      communitySubscribed: true,
    }).select("-password");
    res.json(communitySubscribedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who have communitySubFailed
router.get("/community-sub-failed", async (req, res) => {
  try {
    const communitySubFailedUsers = await User.find({
      communitySubFailed: true,
    }).select("-password");
    res.json(communitySubFailedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who have communitySubWaiting
router.get("/community-sub-waiting", async (req, res) => {
  try {
    const communitySubWaitingUsers = await User.find({
      communitySubWaiting: true,
    }).select("-password");
    res.json(communitySubWaitingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users who are verified
router.get("/verified", async (req, res) => {
  try {
    const verifiedUsers = await User.find({
      verified: true,
    }).select("-password");
    res.json(verifiedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get earnings and withdrawn funds for each user
router.get("/users-financials", async (req, res) => {
  try {
    const users = await User.find().select("-password").lean(); // Convert Mongoose documents to plain JavaScript objects
    const userFinancials = users.map((user) => ({
      ...user,
      totalAmountEarned: user.earnings.reduce(
        (sum, earning) => sum + earning.amountEarned,
        0
      ),
      totalAmountWithdrawn: user.withdrawnFunds.reduce(
        (sum, withdrawal) => sum + withdrawal.amount,
        0
      ),
    }));
    res.json(userFinancials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get only withdrawn funds for each user
router.get("/users-withdrawn-funds", async (req, res) => {
  try {
    const users = await User.find().select("username withdrawnFunds").lean(); // Only select username and withdrawnFunds
    const userWithdrawnFunds = users.map((user) => ({
      username: user.username,
      withdrawnFunds: user.withdrawnFunds,
      totalWithdrawn: user.withdrawnFunds.reduce(
        (sum, withdrawal) => sum + withdrawal.amount,
        0
      ),
    }));
    res.json(userWithdrawnFunds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get only earnings (amountEarned) for each user
router.get("/users-earnings", async (req, res) => {
  try {
    const users = await User.find().select("username earnings").lean(); // Only select username and earnings
    const userEarnings = users.map((user) => ({
      username: user.username,
      earnings: user.earnings,
      totalEarnings: user.earnings.reduce(
        (sum, earning) => sum + earning.amountEarned,
        0
      ),
    }));
    res.json(userEarnings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Update user to be a provider
router.put("/users/make-provider", async (req, res) => {
  try {
    const user = await User.findById(req.body.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.provider = true;
    await user.save();

    res.json({ msg: "User updated to provider", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Update user's communitySubscribed status
router.put("/users/community-subscribed", async (req, res) => {
  try {
    const user = await User.findById(req.body.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.communitySubscribed = req.body.communitySubscribed;
    await user.save();

    res.json({ msg: "User communitySubscribed status updated", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Update user's communitySubFailed status
router.put("/users/community-sub-failed", async (req, res) => {
  try {
    const user = await User.findById(req.body.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.communitySubFailed = req.body.communitySubFailed;
    await user.save();

    res.json({ msg: "User communitySubFailed status updated", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Update user's providerFailed status
router.put("/users/provider-failed", async (req, res) => {
  try {
    const user = await User.findById(req.body.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.providerFailed = req.body.providerFailed;
    await user.save();

    res.json({ msg: "User providerFailed status updated", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all users with KYC information
router.get("/users-with-kyc", async (req, res) => {
  try {
    const usersWithKYC = await User.find({
      "kyc.contentType": { $ne: null },
    }).select("username kyc -_id");
    res.json(usersWithKYC);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


router.put("/approve-withdrawn-fund", async (req, res) => {
  try {
    const { userId, withdrawnFundId, status } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const withdrawnFund = user.withdrawnFunds.id(withdrawnFundId);

    if (!withdrawnFund) {
      return res.status(404).json({ msg: "Withdrawn fund not found" });
    }

    withdrawnFund.status = status;
    await user.save();

    res.json({ msg: "Withdrawn fund status updated", withdrawnFund });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all withdrawals
router.get("/withdrawals", async (req, res) => {
  try {
    const withdrawals = await User.find()
      .select("username withdrawnFunds -_id")
      .lean();

    const allWithdrawals = withdrawals.flatMap((user) => {
      return user.withdrawnFunds.map((withdrawal) => ({
        username: user.username,
        amount: withdrawal.amount,
        recipientAddress: withdrawal.recipientAddress,
        timestamp: withdrawal.timestamp,
        status: withdrawal.status,
      }));
    });

    res.json(allWithdrawals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all earnings
router.get("/earnings", async (req, res) => {
  try {
    const earnings = await User.find().select("username earnings -_id").lean();

    const allEarnings = earnings.flatMap((user) => {
      return user.earnings.map((earning) => ({
        username: user.username,
        amountEarned: earning.amountEarned,
        subscriptionId: earning.subscriptionId,
        subscriptionTitle: earning.subscriptionTitle,
        durationInDays: earning.durationInDays,
        subscriberFirstName: earning.subscriberFirstName,
        subscriberLastName: earning.subscriberLastName,
        timestamp: earning.timestamp,
        status: earning.status,
      }));
    });

    res.json(allEarnings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
// Get all statuses
router.get("/statuses", async (req, res) => {
  try {
    const statuses = await Status.find().lean(); // Use .lean() for plain JavaScript objects
    res.json(statuses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.put("/status/:id", logUpdate, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ msg: "Status not found" });
    }

    Object.assign(status, req.body);
    await status.save();

    res.json({ msg: "Status updated", status });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post('/toggle-verification', async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle the fields to true
    user.verified = true;
    user.provider = true;

    // Save the updated user
    await user.save();

    // Send the response
    res.status(200).json({ message: 'User verified and set as provider successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // Exclude the password field
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.put("/community-status/:id", logUpdate, async (req, res) => {
  try {
    const comStatus = await ComStatus.findById(req.params.id);
    if (!comStatus) {
      return res.status(404).json({ msg: "Community status not found" });
    }

    Object.assign(comStatus, req.body);
    await comStatus.save();

    res.json({ msg: "Community status updated", comStatus });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/subscriptions", async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate("creator").lean();
    res.json(subscriptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
router.get("/subscriptions/:id", async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("creator")
      .lean();
    if (!subscription) {
      return res.status(404).json({ msg: "Subscription not found" });
    }
    res.json(subscription);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().lean();
    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
router.put("/courses/:id", logUpdate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    Object.assign(course, req.body);
    await course.save();

    res.json({ msg: "Course updated", course });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.delete("/courses/:id", logUpdate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    await course.remove();
    res.json({ msg: "Course removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/logs", async (req, res) => {
  try {
    const logs = await Logs.find().sort({ timestamp: -1 }); // Sort logs by most recent
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


// Route to get logs by admin email
router.get("/logs/by-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const logs = await Logs.find({ email }).sort({ timestamp: -1 }); // Sort logs by most recent
    if (logs.length === 0) {
      return res.status(404).json({ msg: "No logs found for this email" });
    }
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Route to get logs by admin ID
router.get("/logs/by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await Logs.find({ adminId: id }).sort({ timestamp: -1 }); // Sort logs by most recent
    if (logs.length === 0) {
      return res.status(404).json({ msg: "No logs found for this ID" });
    }
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
