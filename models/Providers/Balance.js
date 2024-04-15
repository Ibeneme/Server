const mongoose = require("mongoose");
const Subscription = require("./Subscription");

const WithdrawalSchema = new mongoose.Schema({
  requestId: mongoose.Schema.Types.ObjectId,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "failed"],
    default: "pending",
  },
  time: {
    type: Date,
    default: Date.now,
  },
  timeApprovedOrFailed: {
    type: Date,
  },
});

const BalanceSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
  },
  withdrawalableBalance: {
    type: Number,
    default: 0,
  },
  withdrawalRequests: [WithdrawalSchema],
});

BalanceSchema.methods.updateWithdrawalableBalance = function () {
  this.withdrawalableBalance = this.balance - this.totalWithdrawn;
};

BalanceSchema.statics.calculateBalanceByUserId = async function (userId) {
  try {
    const userSubscriptions = await Subscription.find({ creator: userId });
    if (userSubscriptions.length === 0) {
      return 0;
    }

    let totalBalance = 0;
    for (const subscription of userSubscriptions) {
      totalBalance += subscription.balance;
    }
    return totalBalance;
  } catch (error) {
    throw new Error(error);
  }
};

const Balance = mongoose.model("Balance", BalanceSchema);
// // const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);

module.exports = Balance;
