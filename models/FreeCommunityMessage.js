const mongoose = require("mongoose");

const FreeCommunityMessageSchema = new mongoose.Schema(
  {
    freeCommunityId: {
      type: String,
      required: true,
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Assuming you have a User model
          required: true,
        },
        message: {
          type: String,
          // Optional for text messages
        },
        imageUrl: {
          type: String,
          // Optional for image messages
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        freeCommunityId: {
          type: String,
          // Optional for context
        },
        repliedMessage: {
          type: String,
          // Optional for context
        },
        repliedImageUrl: {
          type: String,
        },
        repliedMessageID: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt aznd updatedAt fields automatically
  }
);

const FreeCommunityMessage = mongoose.model(
  "FreeCommunityMessage",
  FreeCommunityMessageSchema
);

module.exports = FreeCommunityMessage;
