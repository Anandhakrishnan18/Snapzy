const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Get conversations list (followed users + existing chats)
router.get("/conversations", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate("following", "userId username profilePic lastSeen");
    
    // Get all messages for the current user
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).sort("-createdAt").populate("sender", "userId username profilePic lastSeen").populate("receiver", "userId username profilePic lastSeen");

    const conversationMap = new Map();

    // 1. First, populate map with all followed users (no messages yet)
    currentUser.following.forEach(u => {
      conversationMap.set(u._id.toString(), {
        user: u,
        lastMessage: null,
        status: null,
        createdAt: new Date(0), // Push to bottom
        unreadCount: 0,
        isMine: false
      });
    });

    // 2. Iterate over messages to find latest message and unread count
    messages.forEach(msg => {
      const isMine = msg.sender._id.toString() === req.user._id.toString();
      const otherUser = isMine ? msg.receiver : msg.sender;
      const otherId = otherUser._id.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: otherUser,
          lastMessage: msg.text,
          status: msg.status,
          createdAt: msg.createdAt,
          unreadCount: 0,
          isMine
        });
      } else {
        // If we already have this user in the map, update if this message is newer
        const existing = conversationMap.get(otherId);
        if (!existing.lastMessage) {
          existing.lastMessage = msg.text;
          existing.status = msg.status;
          existing.createdAt = msg.createdAt;
          existing.isMine = isMine;
        }
      }

      // Count unread (messages sent to me that are not 'seen')
      if (!isMine && msg.status !== 'seen') {
        conversationMap.get(otherId).unreadCount += 1;
      }
    });

    // Convert map to array and sort by latest message
    const conversations = Array.from(conversationMap.values()).sort((a, b) => b.createdAt - a.createdAt);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a specific user
router.get("/:userId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort("createdAt");
    
    // Mark messages as seen
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, status: { $ne: 'seen' } },
      { $set: { status: 'seen' } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post("/", protect, async (req, res) => {
  const { receiverId, text } = req.body;
  try {
    const conversationId = [req.user._id.toString(), receiverId].sort().join("-");
    
    const newMessage = new Message({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
