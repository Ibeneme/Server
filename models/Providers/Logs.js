const mongoose = require("mongoose");
const Subscription = require("./Subscription");

const LogsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscriptions: [
    {
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
      },
      usersCount: Number,
      totalAmountPaid: Number,
    },
  ],
  allUsers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      subscriptionPrice: Number,
    },
  ],
});

LogsSchema.statics.calculateLogsByUserId = async function (userId) {
  try {
    const userSubscriptions = await Subscription.find({ creator: userId });
    let subscriptionsData = [];
    let allUsersData = [];

    for (const subscription of userSubscriptions) {
      const { users, price } = subscription;
      const usersCount = users.length;
      const totalAmountPaid = users.reduce(
        (total, user) => total + user.amountPaid,
        0
      );
      subscriptionsData.push({
        subscriptionId: subscription._id,
        usersCount,
        totalAmountPaid,
      });

      for (const user of users) {
        const userData = await User.findById(user.user);
        allUsersData.push({ userId: userData._id, subscriptionPrice: price });
      }
    }

    return { subscriptions: subscriptionsData, allUsers: allUsersData };
  } catch (error) {
    throw new Error(error);
  }
};

const Logs = mongoose.model("Logs", LogsSchema);

module.exports = Logs;
