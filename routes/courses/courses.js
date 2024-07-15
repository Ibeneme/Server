// routes/courseRoutes.js
const express = require('express');
const Course = require('../../models/Providers/Courses');
const User = require('../../models/Users');
const router = express.Router();
const bcrypt = require("bcrypt");

// POST route to create a new course
router.post('/', async (req, res) => {
  try {
    const { title, description, videos } = req.body;
    const newCourse = new Course({ title, description, videos });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// GET route to fetch all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET route to fetch a specific course by ID
router.get('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// PUT route to update a course by ID
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, videos } = req.body;
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { title, description, videos },
      { new: true }
    );
    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json(updatedCourse);
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE route to delete a course by ID
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const deletedCourse = await Course.findByIdAndDelete(courseId);
    if (!deletedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(204).json(); // No content on successful deletion
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password, "email, password");
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare provided password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }

    // Delete the user from the database
    const deletedUser = await User.findByIdAndDelete(user._id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
