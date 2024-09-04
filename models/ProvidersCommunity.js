const mongoose = require("mongoose");

// Define the schema for community chat messages
const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  subscribedUsers: [
    {
      userId: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ProvidersCommunity = mongoose.model(
  "ProvidersCommunity",
  communitySchema
);

module.exports = ProvidersCommunity;
