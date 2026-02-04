const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, "Invalid mobile number."]
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  friends: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
  ],

  fcmToken: {
    type: String,
    default: null
  }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
