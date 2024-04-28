const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true // Remove leading/trailing whitespace
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure each email is unique in the waiting list
    trim: true,
    lowercase: true // Convert email to lowercase for case-insensitive matching
  }
});

module.exports = mongoose.model('WaitingListUser', waitingListSchema);
