const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define schema for an image with names
const imageSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  imageName: {
    type: String,
    required: true,
  },
});

// Define schema for HomeImages with an array of image objects
const homeImagesSchema = new Schema({
  images: [imageSchema], // Array of image objects with name and URL
});

// Define the model
const HomeImages = mongoose.model('HomeImages', homeImagesSchema);

module.exports = HomeImages;