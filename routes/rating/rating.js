const express = require("express");
const User = require("../../models/Users");
const router = express.Router();

// Route to add a rating to a user
router.post("/rate/", async (req, res) => {
  const { rating, review, _id } = req.body;
  const { firstName, lastName, profilePhoto } = req.user; // Extract userId, raterFirstName, and raterLastName from the decoded token

  const raterfirstName = firstName;
  const raterlastName = lastName;
  console.log(_id, firstName, lastName);
  const userId = _id;
  try {
    // Find the user being rated
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the rating to the user's ratings array
    user.ratings.push({
      user: _id, // Assuming the rater's ID is available in the request object
      firstName: raterfirstName,
      lastName: raterlastName,
      rating: rating,
      review: review,
      profilePhoto: profilePhoto,
      timestamp: Date.now(),
    });

    // Calculate the new average rating for the user
    const totalRatings = user.ratings.length;
    let totalRatingSum = 0;
    user.ratings.forEach((ratingObj) => {
      totalRatingSum += ratingObj.rating;
    });
    user.averageRating = totalRatingSum / totalRatings;

    // Save the updated user object
    await user.save();

    res.status(200).json({ message: "User rated successfully" });
  } catch (error) {
    console.error("Error rating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get ratings of a particular user
router.get("/ratings/", async (req, res) => {
  // const { id } = req.user; // Extract userId, raterFirstName, and raterLastName from the decoded token
  const { id } = req.body;
  const userId = id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send the ratings array of the user
    res.status(200).json({ ratings: user.ratings });
  } catch (error) {
    console.error("Error getting user ratings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
