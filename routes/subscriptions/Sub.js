const express = require("express");
const Subscription = require("../../models/Providers/Subscription");
const User = require("../../models/Users");
const Post = require("../../models/Providers/Post");
const Logs = require("../../models/Providers/Logs");
const router = express.Router();

router.post('/:subscriptionId/:userId/withdrawals', async (req, res) => {
  const { subscriptionId, userId } = req.params;
  const { amount, withdrawalAddress } = req.body;

  try {
    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Find the user within the subscription
    const user = subscription.users.find(user => user._id == userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found within the subscription' });
    }

    // Create the new withdrawal object
    const newWithdrawal = {
      amount,
      withdrawalAddress,
      status: 'pending'
    };

    // Add the withdrawal to the user's withdrawals array
    user.withdrawals.push(newWithdrawal);

    // Save the updated subscription
    await subscription.save();

    res.status(201).json({ message: 'Withdrawal added successfully', withdrawal: newWithdrawal });
  } catch (error) {
    console.error('Error adding withdrawal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Route to create a subscription
router.post("/", async (req, res) => {
  try {
    // Extract subscription details from the request body
    const { creator, title, durationInDays, description, price } = req.body;

    // Create a new subscription
    const subscription = new Subscription({
      creator,
      title,
      durationInDays,
      description,
      price,
    });

    // Save the subscription to the database
    await subscription.save();

    res
      .status(201)
      .json({ message: "Subscription created successfully", subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get all subscriptions
router.get("/", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get a specific subscription by ID
router.get("/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    res.status(200).json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to edit a subscription by ID

router.get('/users/subscribed', async (req, res) => {
  try {
    // Aggregate all users subscribed to all subscriptions
    const result = await Subscription.aggregate([
      { $unwind: "$users" },
      { $group: {
          _id: "$users.user",
          firstName: { $first: "$users.firstName" },
          lastName: { $first: "$users.lastName" },
          totalPaid: { $sum: "$users.amountPaid" }
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/users/subscribe', async (req, res) => {
  try {
    // Aggregate all users subscribed to all subscriptions
    const result = await Subscription.aggregate([
      { $unwind: "$users" },
      { $group: {
          _id: "$users.user",
          users: { $push: {
              firstName: "$users.firstName",
              lastName: "$users.lastName",
              amountPaid: "$users.amountPaid"
          }},
          totalPaid: { $sum: "$users.amountPaid" }
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.get('/users/subscribers', async (req, res) => {
  try {
    // Retrieve subscriptions created by the user
    const subscriptions = await Subscription.find({ creator: req.user._id });

    // Collect users subscribed to those subscriptions
    let subscribedUsers = [];
    subscriptions.forEach(subscription => {
      subscription.users.forEach(user => {
        subscribedUsers.push({
          firstName: user.firstName,
          lastName: user.lastName,
          amountPaid: user.amountPaid
        });
      });
    });

    res.json(subscribedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
router.put("/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const { title, durationInDays, description, price } = req.body;

    console.log(
      title,
      durationInDays,
      description,
      price,
      subscriptionId,
      "pppp"
    );
    // Find the subscription by ID
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Update the subscription fields with the new data
    subscription.title = title;
    subscription.durationInDays = durationInDays;
    subscription.description = description;
    subscription.price = price;

    // Save the updated subscription to the database
    await subscription.save();

    res
      .status(200)
      .json({ message: "Subscription updated successfully", subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get subscriptions of a specific user by user ID

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const subscriptions = await Subscription.find({ creator: userId });
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/posts/:authorId", async (req, res) => {
  const { authorId } = req.params;

  try {
    const posts = await Post.find({ author: authorId }).exec();

    if (!posts) {
      return res
        .status(404)
        .json({ message: "No posts found for this author." });
    }

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/expires/", async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user is associated with any subscriptions
    const subscriptions = await Subscription.find({ "users.user": userId });

    // Filter subscriptions that are two days from expiring
    const subscriptionsTwoDaysToExpire = subscriptions.filter(
      (subscription) => {
        return subscription.users.some((user) => {
          const expirationTwoDays = new Date(user.expirationDate);
          expirationTwoDays?.setDate(expirationTwoDays.getDate() - 2);
          return (
            expirationTwoDays <= new Date() && user?.expirationDate > new Date()
          );
        });
      }
    );

    res.json({ user, subscriptionsTwoDaysToExpire });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Route to delete a subscription by ID
router.delete("/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    await Subscription.findByIdAndDelete(subscriptionId);

    res.status(200).json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/join/:userId", async (req, res) => {
  try {
    // const subscriptionId = req.params.subscriptionId;
    const userId = req.params.userId;
    const { durationPaidFor, subscriptionId } = req.body;

    // Find the subscription by ID
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Get the price of the subscription
    const subscriptionPrice = subscription.price;

    // Calculate the amount to be paid (you may add padding or other calculations here)
    const amountPaid = subscriptionPrice; // For now, just use the subscription price

    // Validate amountPaid to ensure it's a valid number
    if (isNaN(amountPaid) || amountPaid <= 0) {
      return res
        .status(400)
        .json({ error: "Amount paid must be a positive number" });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve user's first name and last name
    const { firstName, profilePhoto, lastName } = user;

    // Check if the user is already subscribed to this subscription
    const isSubscribed = subscription.users.some(
      (subscriber) => subscriber.user.toString() === userId
    );
    if (isSubscribed) {
      return res
        .status(400)
        .json({ error: "User is already subscribed to this subscription" });
    }
    console.log(isSubscribed, "subscriptionId");
    // Calculate subscription expiration date based on current date and duration in days
    const expirationDate = new Date();
    expirationDate.setDate(
      expirationDate.getDate() + subscription.durationInDays
    );

    // Create a new subscription entry for the user
    const newSubscriptionEntry = {
      user: userId,
      firstName: firstName,
      lastName: lastName,
      profilePhoto: profilePhoto,
      subscriptionDate: new Date(),
      expirationDate: expirationDate,
      isRenew: null,
      amountPaid: amountPaid,
      durationPaidFor: durationPaidFor,
      subscriptionId: subscriptionId,
    };

    try {
      subscription.users.push(newSubscriptionEntry);
      await subscription.save();
      console.log("Subscription saved successfully");
    } catch (error) {
      console.error("Error saving subscription:", error);
      // Handle the error appropriately (e.g., return an error response to the client)
    }

    res
      .status(200)
      .json({ message: "User joined the subscription successfully" });
  } catch (error) {
    console.log("Error joining user to subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user/:userId/subscriptions", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find subscriptions where the user is included in the users array
    const subscriptions = await Subscription.find({ "users.user": userId });

    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/leave/:subscriptionId/:userId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const userId = req.params.userId;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const userSubscriptionIndex = subscription.users.findIndex(
      (subscriber) => subscriber.user.toString() === userId
    );
    if (userSubscriptionIndex === -1) {
      return res
        .status(404)
        .json({ error: "User is not subscribed to this subscription" });
    }
    subscription.users.splice(userSubscriptionIndex, 1);
    await subscription.save();

    res
      .status(200)
      .json({ message: "User left the subscription successfully" });
  } catch (error) {
    console.error("Error removing user from subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/total-amount-paid/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const subscriptions = await Subscription.find({ "users.user": userId });

    let totalAmountPaid = 0;
    let userSubscriptions = [];
    subscriptions.forEach((subscription) => {
      const userSubscription = subscription.users.find(
        (sub) => sub.user.toString() === userId
      );
      if (userSubscription) {
        totalAmountPaid += userSubscription.amountPaid || 0; // Add amountPaid if present
        userSubscriptions.push(userSubscription); // Push user's subscription to the array
      }
    });

    res.status(200).json({ totalAmountPaid, userSubscriptions });
  } catch (error) {
    console.error("Error calculating total amount paid:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:subscriptionId/posts", async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const subscriptionId = req.params.subscriptionId;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const newPost = {
      title,
      content,
      author,
    };

    subscription.posts.push(newPost);
    await subscription.save();

    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Posts in Subscription
router.get("posts/", async (req, res) => {
  try {
    // const subscriptionId = req.body
    const subscription = await Subscription.findById(
      "65ffd7d3d21ccdf4aa6b952d"
    );
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.status(200).json(subscription.posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Post by ID
router.get("/:subscriptionId/posts/:postId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const postId = req.params.postId;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const post = subscription.posts.id(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit Post
router.put("/:subscriptionId/posts/:postId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const postId = req.params.postId;
    const { title, content } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const post = subscription.posts.id(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.title = title;
    post.content = content;
    await subscription.save();

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Post
router.delete("/:subscriptionId/posts/:postId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const postId = req.params.postId;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const post = subscription.posts.id(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.remove();
    await subscription.save();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:subscriptionId/create", async (req, res) => {
  try {
    const { title, content, tags, images } = req.body;
    const userId = req.user.id; // Assuming you have user information in the request object after authentication
    const subscriptionId = req.params.subscriptionId;

    // Check if the user is subscribed to the provided subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      creator: userId,
    });
    if (!subscription) {
      return res.status(403).json({
        message:
          "You are not authorized to create posts for this subscription.",
      });
    }

    // Create the post
    const post = new Post({
      title,
      content,
      author: userId,
      subscription: subscriptionId, // Reference to the subscription
    });

    // Add optional fields if provided
    if (tags) post.tags = tags;
    if (images) post.images = images;

    // Save the post
    await post.save();

    res.status(201).json({ message: "Post created successfully.", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/posts", async (req, res) => {
  try {
    const { title, content, author, subscription } = req.body;
    console.log(title, content, author, subscription);
    // Check if subscription exists
    const subscriptionExists = await Subscription.findById(subscription);
    if (!subscriptionExists) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Create the post
    const post = new Post({
      title,
      content,
      author,

      subscription,
    });

    // Save the post
    const savedPost = await post.save();

    // Add the post reference to the subscription's posts array
    subscriptionExists.posts.push(savedPost);
    await subscriptionExists.save();

    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/posts/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const { title, content } = req.body;

    const post = await Post.findByIdAndUpdate(
      postId,
      { title, content },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete a post
router.delete("/posts/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all posts in a subscription
router.get("/posts/subscription/:subscriptionId", async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;

    const posts = await Post.find({ subscription: subscriptionId });

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get a specific post in a subscription
router.get("/posts/subscription/:subscriptionId/:postId", async (req, res) => {
  try {
    const { subscriptionId, postId } = req.params;

    const post = await Post.findOne({
      _id: postId,
      subscription: subscriptionId,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//balance or list of all subcribers
router.get("/subscribedUsers/:creatorId", async (req, res) => {
  const creatorId = req.params.creatorId;

  try {
    const subscriptions = await Subscription.find({ creator: creatorId });

    if (!subscriptions || subscriptions.length === 0) {
      return res
        .status(404)
        .json({ message: "No subscriptions found for the creator" });
    }

    const subscribedUsers = [];
    for (const subscription of subscriptions) {
      for (const user of subscription.users) {
        const userDetails = await User.findById(user.user).select(
          "firstName lastName mobile address profile bio verified provider username name email"
        );
        subscribedUsers.push({
          ...userDetails.toJSON(),
          amountPaid: user.amountPaid,
        });
      }
    }

    return res.json({ subscribedUsers });
  } catch (error) {
    console.error("Error fetching subscribed users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
