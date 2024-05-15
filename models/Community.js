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
      isExpired: {
        type: Boolean,
        required: true,
      },
      isSubscribed: {
        type: Boolean,
        required: true,
      },
      dateJoined: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
  