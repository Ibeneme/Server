// const express = require("express");
// const Balance = require("../../models/Providers/Balance");
// const router = express.Router();

// router.get("/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const balance = await Balance.findOne({ user: userId });

//     if (!balance) {
//       return res.status(404).json({ message: "Balance not found for this user" });
//     }

//     res.json({ balance: balance.balance });
//   } catch (error) {
//     console.error("Error retrieving balance:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// module.exports = router;

const Balance = require("../../models/Providers/Balance");
const Logs = require("../../models/Providers/Logs");
const Subscription = require("../../models/Providers/Subscription");
const Wallet = require("../../models/Providers/Wallet");
const express = require("express");
const User = require("../../models/Users");
const Withdrawal = require("../../models/Providers/Withdrawal");
const router = express.Router();

// router.get("/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const balance = await Wallet.findOne({ user: userId });

//     console.log(userId, balance)
//     if (!balance) {
//       return res.status(404).json({ message: "Balance not found for this user" });
//     }

//     res.json({ balance: balance.totalBalance });
//   } catch (error) {
//     console.error("Error retrieving balance:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

router.get("/logs/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userLogs = await Logs.find({ userId });
    res.json(userLogs);
  } catch (error) {
    console.error("Error retrieving logs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId } = req.user._id;
    const balance = await Balance.findOne({ user: userId });
    if (!balance) {
      return res
        .status(404)
        .json({ message: "Balance not found for the user" });
    }
    return res.json({ balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/create-balance/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userBalance = await Balance.findOne({ user: userId });
    if (!userBalance) {
      return res
        .status(404)
        .json({ message: "Balance not found for the user" });
    }
    res.json({ userBalance });
  } catch (error) {
    console.error("Error getting user balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to withdraw from user's balance
router.put("/create-balance/:requestId", async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { status } = req.body;

    const withdrawalRequest = await Withdrawal.findOne({ requestId });

    if (!withdrawalRequest) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (status !== "approved" && status !== "failed") {
      return res.status(400).json({
        message: "Invalid status. Status must be either 'approved' or 'failed'",
      });
    }

    withdrawalRequest.status = status;
    withdrawalRequest.timeApprovedOrFailed =
      status === "approved" ? Date.now() : null;
    await withdrawalRequest.save();

    // If the request is approved, deduct the amount from the balance
    if (status === "approved") {
      const balance = await Balance.findOne({ user: withdrawalRequest.userId });

      if (!balance) {
        return res
          .status(404)
          .json({ message: "Balance not found for the user" });
      }

      balance.totalWithdrawn += withdrawalRequest.amount;
      balance.updateWithdrawalableBalance();
      await balance.save();
    }

    return res.json({
      message: "Withdrawal request updated successfully",
      withdrawalRequest,
    });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create-balance/withdraw/", async (req, res) => {
  try {
    const { userId, amount, title } = req.body;
    const userBalance = await Balance.findOne({ user: userId });
    if (!userBalance) {
      return res
        .status(404)
        .json({ message: "Balance not found for the user" });
    }
    if (amount <= 0 || amount > userBalance.withdrawalableBalance) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    // Add withdrawal request without immediately deducting from balance
    const withdrawalRequest = {
      userId,
      amount,
      title,
      status: "pending",
      time: Date.now(),
    };

    // Update balance with the withdrawal request
    userBalance.withdrawalRequests.push(withdrawalRequest);
    await userBalance.save();

    res.json({
      message: "Withdrawal request submitted successfully",
      withdrawalRequest,
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create-balance/withdraws/", async (req, res) => {
  try {
    const { userId, amount, title } = req.body;
    const userBalance = await Balance.findOne({ user: userId });
    if (!userBalance) {
      return res
        .status(404)
        .json({ message: "Balance not found for the user" });
    }
    if (amount <= 0 || amount > userBalance.withdrawalableBalance) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }
    // Update balance
    userBalance.balance -= amount;
    userBalance.totalWithdrawn += amount;
    userBalance.withdrawalableBalance -= amount;
    // Add withdrawal request
    userBalance.withdrawalRequests.push({ userId, amount, title });
    await userBalance.save();
    res.json({ message: "Withdrawal request submitted successfully" });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create-balance/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user already has a balance
    const existingBalance = await Balance.findOne({ user: userId });
    if (existingBalance) {
      return res.status(400).json({ message: "User already has a balance" });
    }

    const balance = await Balance.calculateBalanceByUserId(userId);
    const newBalance = new Balance({
      user: userId,
      balance: balance,
      totalWithdrawn: 0,
      withdrawalableBalance: balance,
      withdrawalRequests: [],
    });
    await newBalance.save();

    return res
      .status(201)
      .json({ message: "Balance created successfully", newBalance });
  } catch (error) {
    console.error("Error creating balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/withdraw/", async (req, res) => {
  const { userId, withdrawalAmount } = req.body;

  try {
    // Find the user's wallet
    const userWallet = await Balance.findOne({ user: userId });
    if (!userWallet) {
      return res.status(404).json({ message: "Wallet not found for the user" });
    }

    // Check if the withdrawal amount is valid
    if (withdrawalAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Withdrawal amount must be greater than zero" });
    }

    // Check if the withdrawal amount exceeds the wallet balance
    if (withdrawalAmount > userWallet.totalBalance) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for withdrawal" });
    }

    // Update the wallet balance after withdrawal
    const newBalance = userWallet.totalBalance - withdrawalAmount;
    userWallet.totalBalance = newBalance;
    await userWallet.save();

    return res.json({ message: "Withdrawal successful", newBalance });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create-balance/", async (req, res) => {
  try {
    // Extract userId from the request body
    const { userId } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new balance for the user
    const newBalance = new Balance({
      user: userId,
      balance: 0, // Set initial balance to 0
    });
    await newBalance.save();

    // Calculate the balance for the user
    const balance = await Balance.calculateBalanceByUserId(userId);
    if (balance === null || balance === undefined) {
      return res
        .status(404)
        .json({ message: "Balance not found for the user" });
    }

    return res.status(201).json({
      message: "Balance created successfully",
      balanceId: userId,
      balance,
    });
  } catch (error) {
    console.error("Error creating balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    let totalBalance = 0;
    subscriptions.forEach((subscription) => {
      totalBalance += subscription.balance;
    });

    // Check if a wallet document already exists
    let wallet = await Wallet.findOne();
    if (!wallet) {
      // If wallet doesn't exist, create a new one
      wallet = new Wallet({
        totalBalance,
      });
    } else {
      // If wallet exists, update the total balance
      wallet.totalBalance = totalBalance;
    }

    // Save the updated wallet
    await wallet.save();

    res
      .status(200)
      .json({ message: "Total balance in wallet updated successfully" });
  } catch (error) {
    console.error("Error updating total balance in wallet:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
