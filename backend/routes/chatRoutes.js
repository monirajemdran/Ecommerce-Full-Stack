const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if(!fs.existsSync('./uploads/chats')) {
      fs.mkdirSync('./uploads/chats', { recursive: true });
    }
    cb(null, './uploads/chats/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get chat for a specific buyer
router.get('/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    let chat = await Chat.findOne({ buyer: buyerId }).populate('buyer', 'name email');
    
    if (!chat) {
      // First time, create chat and send automatic admin message
      const user = await User.findById(buyerId);
      if(!user) return res.status(404).json({ message: 'User not found' });
      
      chat = new Chat({
        buyer: buyerId,
        messages: []
      });
      await chat.save();
      chat = await Chat.findById(chat._id).populate('buyer', 'name email');
    }
    
    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:buyerId/message', upload.single('image'), async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { sender, text, replyTo } = req.body;
    const imagePath = req.file ? `uploads/chats/${req.file.filename}` : null;
    
    let chat = await Chat.findOne({ buyer: buyerId });
    if (!chat) {
       chat = new Chat({ buyer: buyerId, messages: [] });
    }
    
    let replyData = null;
    if (replyTo) {
      try { replyData = JSON.parse(replyTo); } catch(e) {}
    }

    chat.messages.push({ sender, text, image: imagePath, replyTo: replyData });
    await chat.save();
    
    // populate before sending
    chat = await Chat.findById(chat._id).populate('buyer', 'name email');
    
    // Emit event to room
    const io = req.app.get('io');
    if (io) {
      io.to(buyerId).emit('newMessage', chat);
    }
    
    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chats for admin
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find().populate('buyer', 'name email').sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit a message
router.put('/:buyerId/message/:messageId', async (req, res) => {
  try {
    const { buyerId, messageId } = req.params;
    const { text } = req.body;

    const chat = await Chat.findOne({ buyer: buyerId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const message = chat.messages.id(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Check if within 30 minutes
    const timeDiff = (Date.now() - new Date(message.timestamp).getTime()) / (1000 * 60);
    if (timeDiff > 30) {
      return res.status(400).json({ message: 'Cannot edit message after 30 minutes' });
    }

    message.text = text;
    message.isEdited = true;
    await chat.save();

    const updatedChat = await Chat.findById(chat._id).populate('buyer', 'name email');
    const io = req.app.get('io');
    if (io) io.to(buyerId).emit('newMessage', updatedChat);

    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message
router.delete('/:buyerId/message/:messageId', async (req, res) => {
  try {
    const { buyerId, messageId } = req.params;

    const chat = await Chat.findOne({ buyer: buyerId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.messages = chat.messages.filter(msg => msg._id.toString() !== messageId);
    await chat.save();

    const updatedChat = await Chat.findById(chat._id).populate('buyer', 'name email');
    const io = req.app.get('io');
    if (io) io.to(buyerId).emit('newMessage', updatedChat);

    res.json(updatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
