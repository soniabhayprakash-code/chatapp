const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  friends: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
  ],
  
  otp: String,
  otpExpiry: Date
});

const User = mongoose.model("User", userSchema);
module.exports = User;