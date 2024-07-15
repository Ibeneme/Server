const mongoose = require('mongoose');

// Define schema for courses
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videos: [{
    title: { type: String, required: true },
    url: { type: String, required: true }
  }],
});

// Create model based on schema
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
