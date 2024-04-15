const mongoose = require('mongoose');

// Define OTP schema
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // OTP expires after 5 minutes (300 seconds)
  },
}, { timestamps: true });

// Create TTL index on createdAt field
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

// Create OTP model
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
