const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [
    {
      sender: { type: String, enum: ['buyer', 'admin'], required: true },
      text: { type: String },
      image: { type: String },
      replyTo: {
        text: String,
        sender: String
      },
      isEdited: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
