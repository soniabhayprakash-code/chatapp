const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/users"); 
const { io } = require("../server");
module.exports = router;

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

router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required."
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password."
      });
    }

    if (!user.isVerified) {
      return res.json({
        success: true,
        otpRequired: true,
        message: "OTP verification required."
      });
    }

    res.json({
      success: true,
      otpRequired: false,
      message: "Login successful.",
      user: {
        name: user.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "--Server error--"
    });
  }
});

router.post("/send-otp", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required."
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); 

    await user.save();

    console.log("OTP for", mobile, "is:", otp); 

    res.json({
      success: true,
      message: "OTP sent successfully."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "--Server error--"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required."
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP."
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "OTP verified successfully."
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
        message: "Already friends"
      });
    }

    me.friends.push(friend._id);
    friend.friends.push(me._id);

    await me.save();
    await friend.save();
    io.to(friend.mobile).emit("friend-added");

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

module.exports = router;

