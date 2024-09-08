const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  count: { type: Number, required: true },
  user: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String },
  },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  video: {
    id: { type: String },   // To store the unique ID of the video in Backblaze B2 or other storage
    url: { type: String }   // To store the URL of the video
  },
  subsections: [
    {
      title: { type: String, required: true },
      description: { type: String },
      video: { type: String },
      highlights: [String],
    },
  ],
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  rating: { type: Number },
  category: { type: String },
  progress: [progressSchema],
  sections: [sectionSchema],
});

module.exports = mongoose.model("Course", courseSchema);
