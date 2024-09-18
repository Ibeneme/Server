const express = require("express");
const HomeImages = require("../models/HomeImage");
//const HomeImages = require("../models/HomeImages");
const router = express.Router();
//const HomeImages = require('../models/HomeImages'); // Adjust path as necessary

// Route to delete all images
router.delete("/delete-all-images", async (req, res) => {
  try {
    await HomeImages.deleteMany({}); // Deletes all documents in HomeImages collection
    res.status(200).json({ message: "All images deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting images", error: err.message });
  }
});

// Helper function to fix image URLs
const fixImageUrls = (images) => {
  return images?.map((imageObj) => {
    // Assuming imageObj is an object where URL characters are spread
    const url = Object.values(imageObj)
      .filter((val) => typeof val === "string")
      .join("");
    return { url, _id: imageObj._id };
  });
};

// Route to add new images
router.post("/add-images", async (req, res) => {
  const { images } = req.body; // Expecting array of { url, imageName }

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ message: "Images array is required" });
  }

  try {
    // Fix image URLs if necessary
    const fixedImages = fixImageUrls(images);

    // Delete all existing images first
    await HomeImages.deleteMany({});

    // Add new images
    const newHomeImages = new HomeImages({ images: fixedImages });
    await newHomeImages.save();

    res
      .status(200)
      .json({ message: "Images added successfully", images: newHomeImages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding images", error: err.message });
  }
});

router.get('/images', async (req, res) => {
    try {
      const homeImages = await HomeImages.find({}); // Use find() to get all images
      res.status(200).json(homeImages);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving images', error: err.message });
    }
  });
  
module.exports = router;
