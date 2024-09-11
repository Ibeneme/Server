const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      minlength: 3,
      maxlength: 30,
    },
    communitySubWaiting: { type: Boolean, default: false },
    communitySubFailed: { type: Boolean, default: false },
    communitySub: { type: Boolean, default: false },
    academySubWaiting: { type: Boolean, default: false },
    academySubFailed: { type: Boolean, default: false },
    academySub: { type: Boolean, default: false },
    proTraderSubWaiting: { type: Boolean, default: false },
    proTraderSubFailed: { type: Boolean, default: false },
    proTraderSub: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    firstName: { type: String, required: true, minlength: 3, maxlength: 30 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 30 },
    email: {
      type: String,
      minlength: 3,
      maxlength: 200,
      unique: true,
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
    providerFailed: { type: Boolean, default: false },
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
        user: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        rating: { type: Number, required: true },
        review: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
        profilePhoto: { type: String, default: null },
      },
    ],
    reported: [
      {
        user: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        report: { type: String },
        imageUrl: { type: String },
      },
    ],
    createdSubscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    ],
    niche: [{ type: String }],
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
    following: [{ type: String }],
    followers: [{ type: String }],
    followersCount: { type: Number, default: 0 },
    freeCommunityId: { type: String, default: null }, // Added field
    freeCommunityFollowed: [{ type: String }],
    timeFrameOfTrades: [{ type: String }],
    assestTraded: [{ type: String }],
    tradingPerformanceData: { type: String },
    proofOfTradingHistory: { type: String },
    clearDescriptionOfStrategy: { type: String },
    riskProfile: { type: String },
    breakdownsSubscriptionsBenefits: { type: String },
    dateBecameProvider: { type: Date, default: null }, // New field for tracking provider activation date
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
  }
);

// Virtual field for average rating
UserSchema.virtual("averageRating").get(function () {
  if (this.ratings.length === 0) {
    return 0;
  }

  const totalRating = this.ratings.reduce(
    (acc, rating) => acc + rating.rating,
    0
  );
  const average = totalRating / this.ratings.length;

  return Math.min(Math.max(average, 0), 5);
});

// Pre-save hook to set freeCommunityId and track provider activation date
UserSchema.pre("save", function (next) {
  // Only set freeCommunityId during the creation of the document, not on updates
  if (this.isNew && this.provider && this.verified && !this.freeCommunityId) {
    this.freeCommunityId = uuidv4();
  }

  // If provider status changes to true, set the dateBecameProvider field
  if (
    this.isModified("provider") &&
    this.provider &&
    !this.dateBecameProvider
  ) {
    this.dateBecameProvider = new Date();
  }

  next();
});

module.exports = mongoose.model("User", UserSchema);
