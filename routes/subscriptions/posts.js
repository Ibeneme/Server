const express = require("express");
const Subscription = require("../../models/Providers/Subscription");
const router = express.Router();

// POST /posts/create
// Create a post visible to subscribed users
router.post("/", async (req, res) => {
  try {
    const { title, content, tags, images, signalId } = req.body;
    const userId = req.user.id; // Assuming you have user information in the request object after authentication

    // Check if the user is subscribed
    const subscription = await Subscription.findOne({ creator: userId });
    if (!subscription) {
      return res
        .status(403)
        .json({
          message: "You are not subscribed. Please subscribe to create posts.",
        });
    }

    // Create the post
    const post = {
      title,
      content,
      author: userId,
    };

    // Add optional fields if provided
    if (tags) post.tags = tags;
    if (images) post.images = images;
    if (signalId) post.signalId = signalId;

    // Add the post to the subscription's posts array
    subscription.posts.push(post);
    await subscription.save();

    res.status(201).json({ message: "Post created successfully.", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
[
  {
      "_id": "65ffd7d3d21ccdf4aa6b952d",
      "creator": "65fbfe7a368ef587cd2508fb",
      "title": "Diamond Subscription",
      "durationInDays": 4,
      "description": "Unlock premium features for 4 days.",
      "price": 9.99,
      "users": [
          {
              "amountPaid": 0,
              "user": "65fbf17842ce7ad246506349",
              "subscriptionDate": "2024-03-24T10:24:53.066Z",
              "expirationDate": "2024-03-28T10:24:53.066Z",
              "isRenew": null,
              "_id": "65ffff7501cbbdb13372ba0f",
              "id": "65ffff7501cbbdb13372ba0f"
          },
          {
              "user": "65fbfe7a368ef587cd2508fb",
              "subscriptionDate": "2024-03-24T12:50:32.381Z",
              "expirationDate": "2024-03-28T12:50:32.381Z",
              "isRenew": null,
              "amountPaid": 9.99,
              "_id": "660021981bce4cabe6e62259",
              "id": "660021981bce4cabe6e62259"
          },
          {
              "user": "65fc486e02aeb70fbb505a87",
              "subscriptionDate": "2024-03-24T14:17:20.381Z",
              "expirationDate": "2024-03-28T14:17:20.381Z",
              "isRenew": null,
              "amountPaid": 9.99,
              "_id": "660035f0a07178711ca54fff",
              "id": "660035f0a07178711ca54fff"
          }
      ],
      "createdAt": "2024-03-24T07:35:47.774Z",
      "updatedAt": "2024-03-27T08:09:42.771Z",
      "__v": 7,
      "posts": [],
      "id": "65ffd7d3d21ccdf4aa6b952d"
  },
  {
      "_id": "660012cd4ea553b2c0043636",
      "creator": "65fbfe7a368ef587cd2508fb",
      "title": "New Subscription",
      "durationInDays": 4,
      "description": "Unlock premium features for 4 days.",
      "price": 9.99,
      "users": [],
      "createdAt": "2024-03-24T11:47:25.866Z",
      "updatedAt": "2024-03-24T11:47:25.866Z",
      "__v": 0,
      "posts": [],
      "id": "660012cd4ea553b2c0043636"
  },
  {
      "_id": "66039a386b8297b53768c593",
      "creator": "65fbfe7a368ef587cd2508fb",
      "title": "Premium Subscription",
      "durationInDays": 30,
      "description": "Access premium features and content for 30 days.",
      "price": 79.99,
      "posts": [],
      "users": [],
      "createdAt": "2024-03-27T04:02:00.804Z",
      "updatedAt": "2024-03-27T04:02:00.804Z",
      "__v": 0,
      "id": "66039a386b8297b53768c593"
  },
  {
      "_id": "6603d38f88ccba06ad0251df",
      "creator": "65fbfe7a368ef587cd2508fb",
      "title": "Change from Premium Subscription",
      "durationInDays": 30,
      "description": "Access premium features and content for 30 days.",
      "price": 100.99,
      "posts": [],
      "users": [],
      "createdAt": "2024-03-27T08:06:39.324Z",
      "updatedAt": "2024-03-27T08:06:39.324Z",
      "__v": 0,
      "id": "6603d38f88ccba06ad0251df"
  },
  {
      "_id": "6603d39488ccba06ad0251e1",
      "creator": "65fbfe7a368ef587cd2508fb",
      "title": "New from Premium Subscription",
      "durationInDays": 30,
      "description": "Access premium features and content for 30 days.",
      "price": 100.99,
      "posts": [],
      "users": [],
      "createdAt": "2024-03-27T08:06:44.661Z",
      "updatedAt": "2024-03-27T08:06:44.661Z",
      "__v": 0,
      "id": "6603d39488ccba06ad0251e1"
  }
]