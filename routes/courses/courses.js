const express = require("express");
const multer = require("multer");
const Course = require("../../models/Providers/Courses"); // Import the Course model
const User = require("../../models/Users"); // Import the User model (adjust the path as needed)
const router = express.Router();
const B2 = require("backblaze-b2");

// Initialize Backblaze B2
const b2 = new B2({
  applicationKeyId: "e8b3c0128769",
  applicationKey: "0058f4534e105eb24f3b135703608c66720edf0beb",
});

// Authorize Backblaze B2
b2.authorize().catch((err) =>
  console.error("Backblaze B2 Authorization failed:", err)
);

// Set the bucket name
const BUCKET_NAME = "trader-signal-app-v1";
const BUCKET_ID = "0e888bf37c0091f288e70619";

const storage = multer.memoryStorage(); // Use memory storage for handling file buffer
const upload = multer({ storage });

// Helper function to upload files to Backblaze B2
const uploadToBackblaze = async (file, fileName) => {
  try {
    console.log(`Uploading ${fileName} to Backblaze B2...`);

    // Get upload URL for the specific bucket
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: BUCKET_ID });
    const { uploadUrl, authorizationToken } = uploadUrlResponse.data;
    console.log(`Upload URL obtained: ${uploadUrl}`);

    // Upload the file
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: `${BUCKET_NAME}/${fileName}`,
      data: file.buffer,
      mime: file.mimetype,
      //title: title,
    });
    console.log(`${fileName} uploaded successfully.`);
    const uploadedFileName = uploadResponse.data.fileName;
    const avatarUrl = `https://f005.backblazeb2.com/file/${BUCKET_NAME}/${uploadedFileName}`;
    console.log(avatarUrl, "avatarUrl");
    // Return the file URL from Backblaze
    return avatarUrl;
  } catch (error) {
    console.error("Backblaze Upload Error:", error);
    throw new Error("Failed to upload file to Backblaze B2");
  }
};

// Helper function to fetch user details
const getUserDetails = async (userIds) => {
  try {
    const users = await User.find({ _id: { $in: userIds } }).select(
      "firstName lastName"
    );
    return users.reduce((acc, user) => {
      acc[user._id] = { firstName: user.firstName, lastName: user.lastName };
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    throw new Error("Failed to fetch user details");
  }
};

router.post("/create-course", upload.single("image"), async (req, res) => {
  const { title, description, rating, category } = req.body;

  // Log the request body and file to debug
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file);

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileBuffer = req.file.buffer;
  const fileName = `courses/${Date.now()}_${req.file.originalname.replace(
    /\s+/g,
    "_"
  )}`;

  try {
    // Get upload URL
    const response = await b2.getUploadUrl({
      bucketId: "0e888bf37c0091f288e70619", // Replace with your bucket ID
    });

    // Upload file to Backblaze B2
    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: fileName,
      data: fileBuffer,
    });

    // Construct file URL
    const bucketName = "trader-signal-app-v1"; // Replace with your bucket name
    const uploadedFileName = uploadResponse.data.fileName;
    const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
    console.log("Avatar URL:", avatarUrl);

    // Create a new course
    const newCourse = new Course({
      title,
      description,
      image: avatarUrl, // Save image path in the course document
      rating,
      category,
      //progress: JSON.parse(progress) || [], // Assuming progress is sent as a JSON string
    });

    const savedCourse = await newCourse.save();
    res
      .status(201)
      .json({ message: "Course created successfully", course: savedCourse });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(400).json({ message: "Error creating course", error });
  }
});

router.put(
  "/:courseId/edit-course",
  upload.single("image"), // Handle single image upload
  async (req, res) => {
    const { courseId } = req.params;
    const { title, description, rating, category } = req.body;
    const file = req.file;

    // Log the request body and file to debug
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", file);

    try {
      // Find the course by ID
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Update course fields
      course.title = title || course.title;
      course.description = description || course.description;
      course.rating = rating || course.rating;
      course.category = category || course.category;

      // Handle image file upload if provided
      if (file) {
        const fileBuffer = file.buffer;
        const fileName = `courses/${Date.now()}_${file.originalname.replace(
          /\s+/g,
          "_"
        )}`;

        // Get upload URL
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619", // Replace with your bucket ID
        });

        // Upload file to Backblaze B2
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });

        // Construct file URL
        const bucketName = "trader-signal-app-v1"; // Replace with your bucket name
        const uploadedFileName = uploadResponse.data.fileName;
        const imageUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
        course.image = imageUrl; // Update course image URL
      }

      // Save updated course
      const updatedCourse = await course.save();
      res
        .status(200)
        .json({
          message: "Course updated successfully",
          course: updatedCourse,
        });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  }
);

router.patch("/update-progress/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const { userId, count } = req.body;

  try {
    if (!userId || count === undefined) {
      return res
        .status(400)
        .json({ error: "User ID and progress count are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the progress entry exists
    const progressEntry = course.progress.find(
      (p) => p.userId.toString() === userId.toString()
    );
    if (progressEntry) {
      progressEntry.count = count;
      progressEntry.user = {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username, // Make sure username is optional
      };
    } else {
      course.progress.push({
        userId,
        count,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username, // Make sure username is optional
        },
      });
    }

    await course.save();
    res.status(200).json({ message: "Progress updated successfully", course });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

router.post(
  "/:courseId/add-section",
  upload.single("image"), // Upload single image for the section
  async (req, res) => {
    const { courseId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Upload section image to Backblaze B2 if provided
      let imageUrl = null;
      if (req.file) {
        const fileBuffer = req.file.buffer;
        const fileName = `sections/${Date.now()}_${req.file.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });
        const bucketName = "trader-signal-app-v1";
        const uploadedFileName = uploadResponse.data.fileName;
        imageUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      // Create new section
      const newSection = {
        title,
        description,
        image: imageUrl,
      };

      course.sections.push(newSection);
      await course.save();
      res.status(201).json({ message: "Section added successfully", course });
    } catch (error) {
      console.error("Error adding section:", error);
      res.status(500).json({ error: "Failed to add section" });
    }
  }
);

router.patch(
  "/:courseId/edit-section/:sectionId",
  upload.single("image"),
  async (req, res) => {
    const { courseId, sectionId } = req.params;
    const { title, description } = req.body;

    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const section = course.sections.id(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      // Update section image if a new one is provided
      let imageUrl = section.image;
      if (req.file) {
        const fileBuffer = req.file.buffer;
        const fileName = `sections/${Date.now()}_${req.file.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });
        const bucketName = "trader-signal-app-v1";
        const uploadedFileName = uploadResponse.data.fileName;
        imageUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      // Update section details
      section.title = title || section.title;
      section.description = description || section.description;
      section.image = imageUrl || section.image;

      await course.save();
      res.status(200).json({ message: "Section updated successfully", course });
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ error: "Failed to update section" });
    }
  }
);

// Delete a section within a course
router.delete("/:courseId/delete-section/:sectionId", async (req, res) => {
  const { courseId, sectionId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find the section index
    const sectionIndex = course.sections.findIndex(
      (section) => section._id.toString() === sectionId
    );
    if (sectionIndex === -1) {
      return res.status(404).json({ error: "Section not found" });
    }

    // Remove the section
    course.sections.splice(sectionIndex, 1);
    await course.save();

    res.status(200).json({ message: "Section deleted successfully", course });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ error: "Failed to delete section" });
  }
});

router.delete("/:courseId/delete-video/:sectionId", async (req, res) => {
  const { courseId, sectionId } = req.params;

  try {
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Find the section
    const section = course.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    // Delete video from Backblaze B2 (if needed)
    // You would need to use Backblaze B2 API to delete the file using the file ID
    // await b2.deleteFileVersion({
    //   fileName: section.video.id,
    //   fileId: section.video.id,
    // });

    // Remove video information from section
    section.video = {
      id: null,
      url: null,
    };
    await course.save();

    res.status(200).json({ message: "Video deleted successfully", course });
  } catch (error) {
    console.error("Error deleting video from section:", error);
    res.status(500).json({ error: "Failed to delete video from section" });
  }
});

router.post(
  "/:courseId/add-or-update-video/:sectionId",
  upload.single("video"), // Upload a single video file
  async (req, res) => {
    const { courseId, sectionId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    try {
      // Find the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Find the section
      const section = course.sections.id(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      // Upload video to Backblaze B2
      const fileBuffer = req.file.buffer;
      const fileName = `videos/${Date.now()}_${req.file.originalname.replace(
        /\s+/g,
        "_"
      )}`;
      const response = await b2.getUploadUrl({
        bucketId: "0e888bf37c0091f288e70619",
      });
      const uploadResponse = await b2.uploadFile({
        uploadUrl: response.data.uploadUrl,
        uploadAuthToken: response.data.authorizationToken,
        fileName: fileName,
        data: fileBuffer,
      });

      // Construct video URL and ID
      const bucketName = "trader-signal-app-v1";
      const uploadedFileName = uploadResponse.data.fileName;
      const videoUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

      // Update section with the new video
      section.video = {
        id: uploadedFileName, // Store the unique ID of the video
        url: videoUrl, // Store the URL of the video
      };
      await course.save();

      res.status(200).json({ message: "Video updated successfully", course });
    } catch (error) {
      console.error("Error updating video in section:", error);
      res.status(500).json({ error: "Failed to update video in section" });
    }
  }
);

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
    { name: "sectionTrailers" },
    { name: "subsectionVideos" },
  ]),
  async (req, res) => {
    try {
      const { title, description, rating, category, sections, progress } =
        req.body;
      console.log(`Received request to add course: ${title} `);
      console.log("Uploaded files:", req.files);
      // Upload files to Backblaze B2
      const image = req.files["image"]
        ? await uploadToBackblaze(
            req.files["image"][0],
            `images/${Date.now()}-${req.files["image"][0].originalname}`
          )
        : null;
      console.log(`Image URL: ${image}`);

      const video = req.files["video"]
        ? await uploadToBackblaze(
            req.files["video"][0],
            `videos/${Date.now()}-${req.files["video"][0].originalname}`
          )
        : null;
      console.log(`Video URL: ${video}`);

      const trailer = req.files["trailer"]
        ? await uploadToBackblaze(
            req.files["trailer"][0],
            `trailers/${Date.now()}-${req.files["trailer"][0].originalname}`
          )
        : null;
      console.log(`Trailer URL: ${trailer}`);

      // Parse sections and subsections
      const parsedSections = JSON.parse(sections).map(
        async (section, index) => {
          console.log(`Processing section: ${section.title}`);

          const sectionTrailer = req.files["sectionTrailers"]
            ? await uploadToBackblaze(
                req.files["sectionTrailers"][index],
                `sectionTrailers/${Date.now()}-${
                  req.files["sectionTrailers"][index].originalname
                }`
              )
            : null;
          console.log(`Section trailer URL: ${sectionTrailer}`);

          const parsedSubsections = section.subsections.map(
            async (subsection, subIndex) => {
              console.log(`Processing subsection: ${subsection.title}`);

              const subsectionVideo = req.files["subsectionVideos"]
                ? await uploadToBackblaze(
                    req.files["subsectionVideos"][subIndex],
                    `subsectionVideos/${Date.now()}-${
                      req.files["subsectionVideos"][subIndex].originalname
                    }`
                  )
                : null;
              console.log(`Subsection video URL: ${subsectionVideo}`);

              return {
                title: subsection.title,
                description: subsection.description,
                video: subsectionVideo,
                highlights: subsection.highlights,
              };
            }
          );

          return {
            title: section.title,
            description: section.description,
            progress: section.progress || 0,
            trailer: sectionTrailer,
            subsections: await Promise.all(parsedSubsections),
          };
        }
      );

      // Handle progress field
      const progressArray = JSON.parse(progress);
      const userIds = progressArray.map((item) => item.userId);
      const userDetails = await getUserDetails(userIds);

      const updatedProgress = progressArray.map((item) => ({
        userId: item.userId,
        count: item.count,
        user: userDetails[item.userId] || {
          firstName: "Unknown",
          lastName: "User",
        },
      }));

      // Create a new course
      const newCourse = new Course({
        title,
        description,
        image,
        video,
        trailer,
        rating,
        category,
        progress: updatedProgress,
        sections: await Promise.all(parsedSections),
      });

      // Save the course to the database
      await newCourse.save();
      console.log("Course saved successfully");

      res
        .status(201)
        .json({ message: "Course added successfully", course: newCourse });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add course" });
    }
  }
);

router.post(
  "/:courseId/:sectionId/add-subsection",
  upload.fields([
    { name: "video", maxCount: 1 }, // Handle single video upload
    { name: "image", maxCount: 1 }, // Optional: Handle single image upload for the subsection
  ]),
  async (req, res) => {
    const { courseId, sectionId } = req.params;
    const { title, description, highlights } = req.body;
    const videoFile = req.files["video"] ? req.files["video"][0] : null;
    const imageFile = req.files["image"] ? req.files["image"][0] : null;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    try {
      // Find the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Find the section
      const section = course.sections.id(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      // Handle video file upload
      let videoUrl = null;
      if (videoFile) {
        const fileBuffer = videoFile.buffer;
        const fileName = `videos/${Date.now()}_${videoFile.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });
        const bucketName = "trader-signal-app-v1";
        const uploadedFileName = uploadResponse.data.fileName;
        videoUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      // Handle image file upload (if needed)
      let imageUrl = null;
      if (imageFile) {
        const fileBuffer = imageFile.buffer;
        const fileName = `subsections/${Date.now()}_${imageFile.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });
        const bucketName = "trader-signal-app-v1";
        const uploadedFileName = uploadResponse.data.fileName;
        imageUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      // Create new subsection
      const newSubsection = {
        title,
        description,
        video: videoUrl,
        highlights: highlights ? highlights.split(",") : [], // Assuming highlights are sent as a comma-separated string
      };

      section.subsections.push(newSubsection);
      await course.save();

      res
        .status(201)
        .json({ message: "Subsection added successfully", course });
    } catch (error) {
      console.error("Error adding subsection:", error);
      res.status(500).json({ error: "Failed to add subsection" });
    }
  }
);

router.put(
  "/:courseId/:sectionId/edit-subsection/:subsectionId",
  upload.fields([
    { name: "video", maxCount: 1 }, // Handle single video upload
    { name: "image", maxCount: 1 }, // Optional: Handle single image upload for the subsection
  ]),
  async (req, res) => {
    const { courseId, sectionId, subsectionId } = req.params;
    const { title, description, highlights } = req.body;
    const videoFile = req.files["video"] ? req.files["video"][0] : null;
    const imageFile = req.files["image"] ? req.files["image"][0] : null;

    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const section = course.sections.id(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      const subsection = section.subsections.id(subsectionId);
      if (!subsection) {
        return res.status(404).json({ error: "Subsection not found" });
      }

      let videoUrl = subsection.video.url;
      if (videoFile) {
        const fileBuffer = videoFile.buffer;
        const fileName = `videos/${Date.now()}_${videoFile.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });
        const bucketName = "trader-signal-app-v1";
        const uploadedFileName = uploadResponse.data.fileName;
        videoUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      let imageUrl = subsection.image;
      if (imageFile) {
        const fileBuffer = imageFile.buffer;
        const fileName = `subsections/${Date.now()}_${imageFile.originalname.replace(
          /\s+/g,
          "_"
        )}`;
        const response = await b2.getUploadUrl({
          bucketId: "0e888bf37c0091f288e70619",
        });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: fileName,
          data: fileBuffer,
        });
        const bucketName = "trader-signal-app-v1";
        const uploadedFileName = uploadResponse.data.fileName;
        imageUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      subsection.title = title || subsection.title;
      subsection.description = description || subsection.description;
      subsection.video = videoFile
        ? { id: videoFile.originalname, url: videoUrl }
        : subsection.video;
      subsection.image = imageFile ? imageUrl : subsection.image;
      subsection.highlights = highlights
        ? highlights.split(",")
        : subsection.highlights;

      await course.save();
      res
        .status(200)
        .json({ message: "Subsection updated successfully", course });
    } catch (error) {
      console.error("Error updating subsection:", error);
      res.status(500).json({ error: "Failed to update subsection" });
    }
  }
);

router.delete(
  "/:courseId/:sectionId/delete-subsection/:subsectionId",
  async (req, res) => {
    const { courseId, sectionId, subsectionId } = req.params;

    try {
      // Find the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Find the section
      const section = course.sections.id(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }

      // Find the subsection and remove it from the array
      const subsectionIndex = section.subsections.findIndex(
        (sub) => sub._id.toString() === subsectionId
      );
      if (subsectionIndex === -1) {
        return res.status(404).json({ error: "Subsection not found" });
      }

      section.subsections.splice(subsectionIndex, 1); // Remove the subsection from the array

      await course.save();
      res
        .status(200)
        .json({ message: "Subsection deleted successfully", course });
    } catch (error) {
      console.error("Error deleting subsection:", error);
      res.status(500).json({ error: "Failed to delete subsection" });
    }
  }
);
// Route to get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Route to get a specific course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error("Failed to fetch course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Route to delete all courses
router.delete("/", async (req, res) => {
  try {
    await Course.deleteMany();
    res.status(200).json({ message: "All courses deleted successfully" });
  } catch (error) {
    console.error("Failed to delete all courses:", error);
    res.status(500).json({ error: "Failed to delete all courses" });
  }
});

// Route to delete a specific course by ID
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Failed to delete course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
    { name: "sectionTrailers" },
    { name: "subsectionVideos" },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, rating, category, sections, progress } =
        req.body;

      console.log(`Received request to update course with ID: ${id}`);

      // Find the existing course
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check and upload new files if provided
      const image = req.files["image"]
        ? await uploadToBackblaze(
            req.files["image"][0],
            `images/${Date.now()}-${req.files["image"][0].originalname}`
          )
        : course.image;
      console.log(`Image URL: ${image}`);

      const video = req.files["video"]
        ? await uploadToBackblaze(
            req.files["video"][0],
            `videos/${Date.now()}-${req.files["video"][0].originalname}`
          )
        : course.video; // Use existing video if no new file
      console.log(`Video URL: ${video}`);

      const trailer = req.files["trailer"]
        ? await uploadToBackblaze(
            req.files["trailer"][0],
            `trailers/${Date.now()}-${req.files["trailer"][0].originalname}`
          )
        : course.trailer; // Use existing trailer if no new file
      console.log(`Trailer URL: ${trailer}`);

      // Parse sections and subsections
      const parsedSections = JSON.parse(sections).map(
        async (section, index) => {
          console.log(`Processing section: ${section.title}`);

          const sectionTrailer = req.files["sectionTrailers"]
            ? await uploadToBackblaze(
                req.files["sectionTrailers"][index],
                `sectionTrailers/${Date.now()}-${
                  req.files["sectionTrailers"][index].originalname
                }`
              )
            : course.sections[index].trailer; // Use existing trailer if no new file
          console.log(`Section trailer URL: ${sectionTrailer}`);

          const parsedSubsections = section.subsections.map(
            async (subsection, subIndex) => {
              console.log(`Processing subsection: ${subsection.title}`);

              const subsectionVideo = req.files["subsectionVideos"]
                ? await uploadToBackblaze(
                    req.files["subsectionVideos"][subIndex],
                    `subsectionVideos/${Date.now()}-${
                      req.files["subsectionVideos"][subIndex].originalname
                    }`
                  )
                : course.sections[index].subsections[subIndex].video; // Use existing video if no new file
              console.log(`Subsection video URL: ${subsectionVideo}`);

              return {
                title: subsection.title,
                description: subsection.description,
                video: subsectionVideo,
                highlights: subsection.highlights,
              };
            }
          );

          return {
            title: section.title,
            description: section.description,
            progress: section.progress || 0,
            trailer: sectionTrailer,
            subsections: await Promise.all(parsedSubsections),
          };
        }
      );

      // Handle progress field
      const progressArray = JSON.parse(progress);
      const userIds = progressArray.map((item) => item.userId);
      const userDetails = await getUserDetails(userIds);

      const updatedProgress = progressArray.map((item) => ({
        userId: item.userId,
        count: item.count,
        user: userDetails[item.userId] || {
          firstName: "Unknown",
          lastName: "User",
        },
      }));

      // Update the course with new data
      course.title = title;
      course.description = description;
      course.image = image;
      course.video = video;
      course.trailer = trailer;
      course.rating = rating;
      course.category = category;
      course.progress = updatedProgress;
      course.sections = await Promise.all(parsedSections);

      // Save the updated course
      await course.save();
      console.log("Course updated successfully");

      res.status(200).json({ message: "Course updated successfully", course });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update course" });
    }
  }
);
module.exports = router;
