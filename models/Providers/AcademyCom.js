const mongoose = require("mongoose");

const AcademyComStatusSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    durationInDays: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, default: null },
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
AcademyComStatusSchema.virtual("isExpired").get(function () {
  // Calculate the expiration time which is 24 hours after createdAt
  //const expirationTime = new Date(this?.createdAt?.getTime() + (24 * 60 * 60 * 1000));

  const expirationTime = new Date(
    this?.createdAt?.getTime() + 24 * 60 * 60 * 1000
  );

  // AcademyCompare expiration time with current time
  return Date?.now() >= expirationTime;
});

// Ensure virtual fields are included when converting the document to JSON
AcademyComStatusSchema?.set("toJSON", { virtuals: true });

const AcademyComStatus = mongoose.model(
  "AcademyComStatus",
  AcademyComStatusSchema
);
module.exports = AcademyComStatus;
