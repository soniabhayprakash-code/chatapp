const express = require('express');
require("dotenv").config();
const app = express();
const http = require('http').createServer(app);
const User = require("./models/user");
const Message = require("./models/Message");
const PushSubscription = require("./models/pushSubscription");


const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});






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


app.post("/api/save-fcm-token", async (req, res) => {

  console.log("TOKEN API HIT");
  console.log(req.body);

  const { token, mobile } = req.body;

  if (!token || !mobile) {
    console.log("Missing token/mobile");
    return res.status(400).json({ error: "Missing data" });
  }

  const result = await User.updateOne(
    { mobile },
    { $set: { fcmToken: token } }
  );

  console.log("Mongo result:", result);

  res.json({ success: true });
});

// app.post("/api/save-fcm-token", async (req, res) => {

//   const { token, mobile } = req.body;

//   if (!token) return res.sendStatus(400);

//   await User.updateOne(
//     { mobile },
//     { $set: { fcmToken: token } }
//   );

//   res.json({ success: true });
// });




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
    const receiverUser = await User.findOne({ mobile: receiver });
      if (receiverUser?.fcmToken) {
      const senderUser = await User.findOne({ mobile: sender });
      const senderName = senderUser?.name || "Someone";
      const messagePayload = {
            token: receiverUser.fcmToken,
            notification: {
            title: `${senderName} sent message`,
            body: data.message,
            },
            data: {
                sender,
                roomId,
                type: "chat"
            }
     };
    try {
      await admin.messaging().send(messagePayload);
      console.log("FCM push sent to:", receiver);
    } catch (err) {
      console.error("FCM error:", err.message);
    }

  } else {
    console.log("No FCM token for:", receiver);

    //   const subs = await PushSubscription.find({
    //     mobile: receiver
    //   });

    //   subs.forEach(async sub => {
    //   const senderUser = await User.findOne({ mobile: sender });
    //   const senderName = senderUser?.name || "Someone";
    // try {
    //   await webPush.sendNotification(
    //   sub,
    //   JSON.stringify({
    //   title: `${senderName} send Message`,
    //   body: data.message,
    //   data: {
    //     url: "/chat.html"
    //   }
    //   })
    // );
    // console.log("Push sent to:", sub.mobile);
    // } catch (err) {
    //   console.error("Push error:", err.statusCode, err.body);
    // }
    // });
    } catch (err) {
      console.error("Message save error:", err);
    }

  });

  socket.on("call-user", async ({ to, from }) => {

  const user = await User.findOne({ mobile: from });
  const senderName = user?.name || "Unknown";

  const targetSocket = onlineUsers.get(to);
  if (!targetSocket) {
      console.log("User offline:", to);
      return;
    }

  if (targetSocket) {
    io.to(targetSocket).emit("incoming-call", {
      from,
      name: senderName
    });
  }

  });

  socket.on("call-offer", ({ to, offer, from, name }) => {
  const targetSocket = onlineUsers.get(to);
  if (!targetSocket) {
      console.log("User offline:", to);
      return;
  }

  if (targetSocket) {
    io.to(targetSocket).emit("call-offer", {
      offer,
      from,
      name
    });
  }
});


socket.on("call-answer", ({ to, from, answer }) => {

  const targetSocket = onlineUsers.get(to);
  if (!targetSocket) {
      console.log("User offline:", to);
      return;
  }

  if (targetSocket) {
    io.to(targetSocket).emit("call-answer", {
      answer,
      from
    });
  }
});

socket.on("accept-call", ({ to }) => {
  const target = onlineUsers.get(to);
  if (target) {
    io.to(target).emit("call-accepted");
  }
});


socket.on("call-ice", ({ to, candidate, from }) => {

  const targetSocket = onlineUsers.get(to);
  if (!targetSocket) {
      console.log("User offline:", to);
      return;
  }

  if (targetSocket) {
    io.to(targetSocket).emit("call-ice", {
      candidate,
      from
    });
  }
});

socket.on("call-end", ({ to }) => {
  const targetSocket = onlineUsers.get(to);
  if (!targetSocket) {
      console.log("User offline:", to);
      return;
  }

  if (targetSocket) {
    io.to(targetSocket).emit("call-end");
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





























