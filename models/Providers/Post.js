const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    tradeGoneWrong: { type: Boolean, default: false },
    tradeGoneWrongReason: { type: String, required: false },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String }],
    authorLastName: { type: String, default: null },
    authorFirstName: { type: String, default: null },
    tp1: { type: Number, default: null },
    tp2: { type: Number, default: null },
    tp3: { type: Number, default: null },
    tp4: { type: Number, default: null },
    tp5: { type: Number, default: null },
    sl: { type: Number, default: null },
    pair: { type: String, default: null },

    images: [{ type: String }], // Array to store URLs of multiple images
    views: { type: Number, default: 0 }, // Number of views, default to 0
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        admin: {
          type: String,
        },
        sender: {
          type: String,
        },

        msg: {
          type: String,
        },
        timestamp: { type: Date, default: Date.now }, // Timestamp of the comment
      },
    ],
    createdAt: { type: Date, default: Date.now }, // Timestamp for post creation
    updatedAt: { type: Date, default: null }, // Timestamp for last update
    // subscription: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Subscription",
    //   // required: true,
    // },
    subscriptionId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Update the 'updatedAt' field before saving if the post is being updated
PostSchema.pre("save", function (next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
