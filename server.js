const express = require('express');
require("dotenv").config();
const app = express();
const http = require('http').createServer(app);
const User = require("./models/user");
const Message = require("./models/Message");
const PushSubscription = require("./models/pushSubscription");
const mongoose = require("mongoose");
const io = require('socket.io')(http, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const webPush = require("web-push");
webPush.setVapidDetails(
  "mailto:test@chatapp.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
app.use(express.json());
app.post("/subscribe", async (req, res) => {

  const { endpoint, keys, mobile } = req.body;
  const existing = await PushSubscription.findOne({ endpoint });
  if (existing) {
    return res.json({ success: true, already: true });
  }
  await PushSubscription.create({
    endpoint,
    keys,
    mobile
  });
  res.json({ success: true });
});

app.set("io", io);
const onlineUsers = new Map();
app.use(express.static(__dirname));
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected."))
.catch(err => console.log(err));

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

  socket.on("joinRoom", async ({ roomId }) => {
    socket.join(roomId);
    const chats = await Message.find({ roomId })
          .sort({ createdAt: 1 });
    socket.emit("loadMessages", chats);

  });

  socket.on("typing", ({ roomId, mobile }) => {
    socket.to(roomId).emit("showTyping", { mobile });
  });

  socket.on("stopTyping", ({ roomId }) => {
    socket.to(roomId).emit("hideTyping");
  });

  socket.on("sendMessage", async (data) => {
  try {
    const { roomId, sender, message } = data;
    const users = roomId.split("_");
    const receiver = users.find(m => m !== sender);

    await Message.create({
      roomId,
      sender,
      receiver,
      message
    });

    io.to(roomId).emit("receiveMessage", data);
      const subs = await PushSubscription.find({
        mobile: { $ne: data.sender }
    });
      subs.forEach(async sub => {
      const senderUser = await User.findOne({ mobile: sender });
      const senderName = senderUser?.name || "Someone";
    try {
      await webPush.sendNotification(
      sub,
      JSON.stringify({
      title: `${senderName} send Message`,
      body: data.message,
      data: {
        url: "/chat.html"
      }
      })
    );
    console.log("Push sent to:", sub.mobile);
    } catch (err) {
      console.error("Push error:", err.statusCode, err.body);
    }
    });
      
    } catch (err) {
      console.error("Message save error:", err);
    }

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














