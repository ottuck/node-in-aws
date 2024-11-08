// models/Message.js

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  profileImage: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);
