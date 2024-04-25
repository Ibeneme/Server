const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const register = require("./routes/register.js");
const login = require("./routes/login.js");
const mongoose = require("mongoose");
const app = express();
const PORT = 3002;
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const userss = require("./routes/users.js");
const updateUser = require("./routes/updateUser.js");
const authMiddleware = require("./middleware/auth.js");
const generateOTP = require("./routes/otp/otp.js");
const localVariables = require("./middleware/localVariable.js");
const verifyOTP = require("./routes/otp/verify.js");
const passwordReset = require("./routes/auth/resetPassword.js");
const uploadVideo = require("./routes/auth/uploadVideo.js");
const createPost = require("./routes/posts/posts.js");
const allPosts = require("./routes/posts/allPosts.js");
const usersPosts = require("./routes/posts/getPost.js");
const editPost = require("./routes/posts/editPost.js");
const deletePost = require("./routes/posts/deletePost.js");
const comment = require("./routes/posts/comment.js");
const editDeleteComment = require("./routes/posts/editComments.js");
const subscription = require("./routes/subscriptions/Sub.js");
const balance = require("./routes/balance/balance.js");
const create = require("./routes/posts/createPost.js");
const sub = require("./routes/subscriptions/Sub.js");
const videos = require("./routes/auth/pushVideoTest.js");
const forgot = require("./routes/otp/forgotPasswordOtp.js");
const profilePic = require("./routes/auth/profilePic.js");
const CreatePost = require("./routes/posts/posts.js");
const status = require("./routes/subscriptions/status.js");
const Message = require("./models/Message.js");
const messagesRouter = require("./routes/Messages.js");
const Post = require("./models/Providers/Post.js");
const rating = require("./routes/rating/rating.js");
const withdraws = require("./routes/withdrawal/withdrawal.js");
const allCommunityChats = require("./routes/chats/chat.js");

const initializeChatRouter = require("./routes/chats/chatRouter.js");
const User = require("./models/Users.js");
const CommunityChat = require("./models/CommunityChat.js");
require("dotenv").config();

const chatRouter = initializeChatRouter(server);
app.use("/chat", chatRouter);

app.use(express.json());
app.use(bodyParser.json());
app.use(localVariables);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const communityIo = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle chat messages
  socket.on("message", (data) => {
    console.log("Message received:", data);
    io.emit("message", data); // Broadcast message to all connected clients
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

communityIo.on("connection", (socket) => {
  socket.on("join community", async (userId) => {
    try {
      socket.leaveAll();
      socket.join("community");

      // Fetch user from the User model
      const user = await User.findById(userId);
      if (!mongoose.isValidObjectId(userId)) {
        console.log(`Invalid userId: ${userId}`);
        return;
      }
      if (user) {
        // If user exists, emit the first name and last name to the client
        const { firstName, lastName } = user;
        socket.emit("user details", { firstName, lastName });

        console.log(`User ${userId} joined the community`);
      } else {
        console.log(`User ${userId} not found`);
      }
    } catch (error) {
      console.error("Error joining community:", error);
    }
  });

  socket.on("community message", async (userId, msg) => {
    try {
      console.log(`User ${userId} sent message: ${msg?.msg}`);

      // Fetch user from the User model to ensure first name and last name
      const user = await User.findById(userId);
      if (user) {
        const { firstName, lastName } = user;

        // Create a new CommunityChat message
        const newMessage = new CommunityChat({
          userId: userId,
          firstName: firstName,
          lastName: lastName,
          message: msg?.msg,
          timestamp: new Date().toISOString(),
        });

        // Save the message to the database
        const savedMessage = await newMessage.save();

        console.log(savedMessage, "message");
        communityIo.to("community").emit("community message", savedMessage);
      } else {
        console.log(`User ${userId} not found while sending message`);
      }
    } catch (error) {
      console.error("Error handling community message:", error);
    }
  });
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("join group", async (userId, postID) => {
    socket.leaveAll();
    socket.join(postID);
    console.log(`User ${userId} joined group ${postID}`);
    try {
      const previousMessages = await Post.find({ postID })
        .sort({
          timestamp: 1,
        })
        .lean();

      console.log(previousMessages, "previousMessages");
      socket.emit("previous messages", previousMessages);
    } catch (error) {
      console.error("Error fetching previous messages:", error);
    }
  });
  socket.on("chat message", async (userId, msg, postID) => {
    console.log(`User ${userId} sent message: ${msg?.msg}`);
    console.log(msg, "msg");
    try {
      Post.findById(postID)
        .then((post) => {
          // Check if post exists
          if (!post) {
            return "Post not found";
          }
          const newComment = {
            admin: msg?.admin,
            sender: msg?.sender,
            user: userId, // Assuming you have user authentication
            msg: msg?.msg, // Assuming comment text is in request body
          };

          post.comments.push(newComment);
          console.log(newComment, "newComment");
          return post.save();
        })
        .then((savedPost) => {})
        .catch((error) => {
          console.error(error);
          return "Error adding comment";
        });
      const message = msg;

      console.log(message, "message");
      io.to(postID).emit("chat message", message);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });
});

//https://server-3qpe.onrender.com/
app.use("/api/v1/messages", messagesRouter);
app.use("/api/v1/auth/register/", register);
app.use("/api/v1/auth/login/", login);
app.use("/api/v1/auth/users/", authMiddleware, userss);
app.use("/api/v1/auth/updateUser/", authMiddleware, updateUser);
app.use("/api/v1/auth/profilepic/", authMiddleware, profilePic);
app.use("/api/v1/auth/verifyOTP/", localVariables, verifyOTP);
app.use("/api/v1/auth/generateOTP/", localVariables, generateOTP);
app.use("/api/v1/auth/reset-password/", passwordReset);
app.use("/api/v1/auth/uploadVideo/", authMiddleware, uploadVideo);
app.use("/api/v1/auth/videos/", authMiddleware, videos);

app.use("/api/v1/auth/verifyOTPs/", verifyOTP);
app.use("/api/v1/auth/generateOTPs/", generateOTP);
app.use("/api/v1/auth/generateOTP/", forgot);

app.use("/api/v1/post/create-post/", authMiddleware, createPost);
app.use("/api/v1/post/all-posts/", authMiddleware, allPosts);
app.use("/api/v1/post/users-posts/", authMiddleware, usersPosts);
app.use("/api/v1/post/edit-users-posts/", authMiddleware, editPost);
app.use("/api/v1/post/delete-post/", authMiddleware, deletePost);
app.use("/api/v1/post/comment/", authMiddleware, comment);
app.use("/api/v1/post/comment/", authMiddleware, editDeleteComment);

app.use("/api/v1/sub/", authMiddleware, sub);
app.use("/api/v1/posts/create/", authMiddleware, create);
app.use("/api/v1/provider/subscription/", authMiddleware, subscription);
app.use("/api/v1/sub/balance/", authMiddleware, balance);
app.use("/api/v1/status/", authMiddleware, status);
app.use("/api/v1/withdraws/", authMiddleware, withdraws);

app.use("/api/v1/rating/", authMiddleware, rating);
app.use("/api/v1/allCommunityChats/", authMiddleware, allCommunityChats);

app.disable("x-powered-by");

const uri =
  "mongodb+srv://ibeneme_:Ibeneme_1996@tradersignalapp.qbqd2hz.mongodb.net/?retryWrites=true&w=majority&appName=TraderSignalApp";
app.get("/", (req, res) => {
  res.send("Hello, World people todayyyy!");
});
server.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`);
});

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 100000,
  })
  .then(() => console.log("MongoDB connected here and successfully"))
  .catch((error) => console.log("MongoDB connection failed", error));
