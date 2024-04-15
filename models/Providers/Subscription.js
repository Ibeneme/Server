const mongoose = require("mongoose");
const Post = require("./Post");

const SubscriptionSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    durationInDays: { type: Number, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    posts: [Post.schema],
    status: { type: String, default: null },
    subscriptionId: { type: String },
    users: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        firstName: { type: String },
        lastName: { type: String },
        profilePhoto: { type: String },
        subscriptionDate: { type: Date, default: Date.now },
        expirationDate: { type: Date },
        isRenew: { type: String, enum: ["pending", "expired"], default: null },
        amountPaid: { type: Number, default: 0 },
        durationPaidFor: { type: Number },
        isExpired: { type: Boolean, default: false },
        twoDaysToExpire: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SubscriptionSchema.virtual("balance").get(function () {
  return this.users.length * this.price;
});

SubscriptionSchema.index(
  { "users.expirationDate": 1 },
  { expireAfterSeconds: 0 }
);

SubscriptionSchema.pre('findOneAndUpdate', function (next) {
  const expiredUsers = this.getUpdate().$pullAllByPath["users"].filter(
    (user) => user.expirationDate <= new Date()
  );
  if (expiredUsers.length > 0) {
    this.update({}, { $pullAll: { users: expiredUsers } });
  }
  this.users.forEach((user) => {
    if (user.expirationDate && user.expirationDate <= currentDate) {
      user.isExpired = true;
    }
  });

  const currentDate = new Date();
  const twoDaysLater = new Date();
  twoDaysLater.setDate(currentDate.getDate() + 2);

  this.users.forEach((user) => {
    if (user.expirationDate) {
      const expirationTwoDays = new Date(user.expirationDate);
      expirationTwoDays.setDate(expirationTwoDays.getDate() - 2);
      if (
        expirationTwoDays <= currentDate &&
        user.expirationDate > currentDate
      ) {
        user.twoDaysToExpire = true;
      }
      if (user.expirationDate <= currentDate) {
        user.isExpired = true;
      }
    }
  });

  next();
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);
module.exports = Subscription;
