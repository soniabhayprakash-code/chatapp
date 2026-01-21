const express = require('express');
require("dotenv").config();
const app = express();
const http = require('http').createServer(app);
const mongoose = require("mongoose");
const io = require('socket.io')(http, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
app.use((req, res, next) => {
  console.log("INCOMING:", req.method, req.url);
  next();
});
app.set("io", io);
const onlineUsers = new Map();
app.use(express.json());
app.use(express.static(__dirname));
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected."))
.catch(err => console.log(err));

// app.use(express.json());
const authRoutes = require("./routes/auth");

app.use("/auth", authRoutes);
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.set("onlineUsers", onlineUsers);
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register-user", (mobile) => {
    onlineUsers.set(mobile, socket.id);
    console.log("Online:", mobile);
  });

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    socket.emit("roomJoined", { roomId });
  });

  socket.on("sendMessage", (data) => {
    io.to(data.roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    for (let [mobile, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(mobile);
        console.log("Offline:", mobile);
      }
    }
    console.log("User disconnected:", socket.id);
    });
  });

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('--Started--');
    console.log("Server running on port", PORT);
});

// http.listen(3000, () => {
//     console.log('=====================================');
//     console.log('--Started--');
//     console.log('Go to Browser: http://localhost:3000');
//     console.log('=====================================');
// });






