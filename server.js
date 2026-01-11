require("dotenv").config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require("mongoose");

const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

module.exports = { io };
app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected."))
  .catch(err => console.log(err));

const authRoutes = require("./routes/auth");

app.use("/auth", authRoutes);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

io.on("connection", (socket) => {
  console.log("User connected.");

  socket.on("join", (mobile) => {
    socket.join(mobile);
    console.log("User joined room:", mobile);
  });

  socket.on("friend-added", (data) => {
    const { to } = data;
    io.to(to).emit("friend-added", data);
  });

  socket.on("chat message", (data) => {
    const { from, to, text } = data;

    io.to(to).emit("chat message", {
      from,
      to,
      text
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected.");
  });
});

http.listen(3000, () => {
  console.log('=====================================');
  console.log('--Started--');
  console.log('Go to Browser: http://localhost:3000');
  console.log('=====================================');
});




