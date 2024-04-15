const mongoose = require("mongoose");

const StatusSchema = new mongoose.Schema(
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
StatusSchema.virtual("isExpired").get(function () {
  // Calculate the expiration time which is 24 hours after createdAt
  //const expirationTime = new Date(this?.createdAt?.getTime() + (24 * 60 * 60 * 1000));

  const expirationTime = new Date(
    this?.createdAt?.getTime() + 24 * 60 * 60 * 1000
  );

  // Compare expiration time with current time
  return Date?.now() >= expirationTime;
});

// Ensure virtual fields are included when converting the document to JSON
StatusSchema?.set("toJSON", { virtuals: true });

const Status = mongoose.model("Status", StatusSchema);
module.exports = Status;
