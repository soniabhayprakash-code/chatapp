const mongoose = require("mongoose");

const pushSchema = new mongoose.Schema({
  endpoint: String,
  keys: Object,
  mobile: String
});

module.exports = mongoose.model("PushSubscription", pushSchema);
