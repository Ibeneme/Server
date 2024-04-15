


const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
    },
    deleted: { type: Boolean, default: false },
    firstName: { type: String, require: true, minlength: 3, maxlength: 30 },
    lastName: { type: String, require: true, minlength: 3, maxlength: 30 },
    email: {
      type: String,
      minlength: 3,
      maxlength: 200,
      unique: true,
    },
    phoneNumber: {
      type: String,
      require: true,
      minlength: 3,
      maxlength: 200,
      unique: true,
    },
    password: {
      type: String,
      require: true,
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
    averagePrice: { type: Number, default: 0 },
    provider: { type: Boolean, default: false },
    profilePhoto: { type: String },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // References to posts made by the user
    kyc: {
      contentType: { type: String, default: null },
    },
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
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
