const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Get all notifications for user
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user._id })
      .sort("-createdAt")
      .populate("sender", "userId username profilePic")
      .populate("post", "content media");
      
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all as read
router.put("/read", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create notification
router.post("/", protect, async (req, res) => {
  const { receiver, type, post } = req.body;
  
  if (receiver === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot notify yourself" });
  }

  try {
    const notification = new Notification({
      sender: req.user._id,
      receiver,
      type,
      post: post || null
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
