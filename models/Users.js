const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      minlength: 3,
      maxlength: 30,
    },
    communitySubWaiting: { type: Boolean, default: false },
    communitySub: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    firstName: { type: String, required: true, minlength: 3, maxlength: 30 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 30 },
    email: {
      type: String,
      minlength: 3,
      maxlength: 200,
      unique: true,
    },
    phoneNumber: {
      type: String,
      minlength: 3,
      maxlength: 200,
      default: null,
    },
    password: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 1024,
    },
    deposits: [
      {
        durationInDays: { type: Number, required: true },
        price: { type: Number, required: true },
        status: { type: String, default: null },
        subscriptionId: { type: String },
        description: { type: String, default: null },
        title: { type: String },
        subscriberId: { type: String, default: null },
        imageProof: { type: String, default: null },
        firstName: { type: String, default: null },
        lastName: { type: String, default: null },
      },
    ],
    mobile: { type: String, default: null },
    status: { type: String, default: null },
    address: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    bio: { type: String, default: null },
    verified: { type: Boolean, default: false },
    communitySubscribed: { type: Boolean, default: false },
    averagePrice: { type: Number, default: 0 },
    provider: { type: Boolean, default: false },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    kyc: {
      contentType: { type: String, default: null },
    },
    profilePhotoOrVideo: { type: String, default: null },
    subscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    ],
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        firstName: { type: String },
        lastName: { type: String },
        rating: { type: Number, required: true },
        review: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
        profilePhoto: { type: String, default: null },
      },
    ],
    createdSubscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    ],
    niche: { type: String, default: null },
    totalBalance: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    withdrawnFunds: [
      {
        amount: { type: Number, required: true },
        recipientAddress: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        status: { type: String },
      },
    ],
    earnings: [
      {
        amountEarned: { type: Number, required: true },
        subscriptionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subscription",
        },
        subscriptionTitle: { type: String },
        durationIndays: { type: String },
        subscriberFirstName: { type: String },
        subscriberLastName: { type: String },
        timestamp: { type: Date, default: Date.now },
        status: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
