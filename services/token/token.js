const mongoose = require("mongoose");

const tokenSchema = newSchema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user",
    unique: true,
  },
  token: { type: String, require: true },
  createdAt: { type: Date, default: Date.now(), expires: 3600 },
});

module.exports = mongoose.model("token", tokenSchema);
