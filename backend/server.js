const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);
  
  socket.on("joinChat", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their chat room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});

app.set("io", io);

app.use(cors());
app.use(express.json());

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ROUTES
const authRoutes = require("./routes/authRoutes");

const productRoutes = require("./routes/productRoutes");

const cartRoutes = require("./routes/cartRoutes");

const orderRoutes = require("./routes/orderRoutes");

const wishlistRoutes =require("./routes/wishlistRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const chatRoutes = require("./routes/chatRoutes");
const imageSearchRoutes = require("./routes/imageSearchRoutes");
const returnRoutes = require("./routes/returnRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");

// USE ROUTES
app.use("/api/users", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/delivery", deliveryRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/complaints", complaintRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/images", imageSearchRoutes);

app.use("/api/returns", returnRoutes);
app.use("/api/utils", geocodeRoutes);

// TEST ROUTE
app.get("/", (req, res) => {

  res.send("Backend Working");

});


// MONGODB
mongoose.connect(process.env.MONGO_URL)

.then(() => {

  console.log("MongoDB Connected");

})

.catch((err) => {

  console.log(err);

});


// SERVER
server.listen(5000, () => {
  console.log("Server Running on 5000");
});