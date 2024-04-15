const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
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
  {
    timestamps: true, // Add timestamps for createdAt and updatedAt
  }
);

// Define a virtual field 'isExpired'
TransactionSchema.virtual("isExpired").get(function () {
  const expirationTime = new Date(
    this?.createdAt?.getTime() + 24 * 60 * 60 * 1000
  );

  // Compare expiration time with current time
  return Date?.now() >= expirationTime;
});

// Ensure virtual fields are included when converting the document to JSON
TransactionSchema?.set("toJSON", { virtuals: true });

const Transaction = mongoose.model("Transaction", TransactionSchema);
module.exports = Transaction;
