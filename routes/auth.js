const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user"); 

router.post("/register", async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res.json({
        success: false,
        message: "All fields are required."
      });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.json({
        success: false,
        message: "Mobile already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      mobile,
      password: hashedPassword
    });

    await newUser.save();

    res.json({
      success: true,
      message: "User registered successfully."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "--Server error--"
    });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const mobile = req.query.mobile;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number required."
      });
    }

    const user = await User.findOne({ mobile }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "--Server error--"
    });
  }
});

router.post("/add-friend", async (req, res) => {
  try {
    const { myMobile, friendMobile } = req.body;

    if (!myMobile || !friendMobile) {
      return res.json({
        success: false,
        message: "Both mobile numbers required."
      });
    }

    if (myMobile === friendMobile) {
      return res.json({
        success: false,
        message: "You cannot add yourself."
      });
    }

    const me = await User.findOne({ mobile: myMobile });
    const friend = await User.findOne({ mobile: friendMobile });

    if (!friend) {
      return res.json({
        success: false,
        message: "User not found."
      });
    }

    if (me.friends.includes(friend._id)) {
      return res.json({
        success: false,
        message: "Already friends."
      });
    }

    me.friends.push(friend._id);
    friend.friends.push(me._id);

    await me.save();
    await friend.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const friendSocketId = onlineUsers.get(friendMobile);
      if (friendSocketId) {
        io.to(friendSocketId).emit("friend-added", {
        mobile: myMobile
      });
    }

    res.json({
      success: true,
      message: "Friend added successfully."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "--Server error--"
    });
  }
});

router.get("/friends", async (req, res) => {
  try {
    const mobile = req.query.mobile;

    const user = await User.findOne({ mobile })
      .populate("friends", "name mobile");

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      friends: user.friends
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "--Server error--"
    });
  }
});

router.post("/delete-user", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.json({
        success: false,
        message: "Mobile number required."
      });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found."
      });
    }

    await User.deleteOne({ mobile });

    return res.json({
      success: true,
      message: "User deleted."
    });

  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.json({
      success: false,
      message: "--Server error--"
    });
  }
});

module.exports = router;
