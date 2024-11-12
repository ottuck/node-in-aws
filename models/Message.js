// models/Message.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  profileImage: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

export default Message;
