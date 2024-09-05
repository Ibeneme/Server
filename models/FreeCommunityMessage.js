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
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        freeCommunityId: {
          type: String,
         // required: true,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const FreeCommunityMessage = mongoose.model(
  "FreeCommunityMessage",
  FreeCommunityMessageSchema
);

module.exports = FreeCommunityMessage;
