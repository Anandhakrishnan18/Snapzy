const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { createNotification } = require("../utils/notification");
const Notification = require("../models/Notification");

const router = express.Router();

// Search users
router.get("/search", protect, async (req, res) => {
  const keyword = req.query.search ? {
    $or: [
      { username: { $regex: req.query.search, $options: "i" } },
      { userId: { $regex: req.query.search, $options: "i" } }
    ]
  } : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select("-password");
  res.json(users);
});

// Get user profile
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
      .populate("followers", "userId username profilePic")
      .populate("following", "userId username profilePic");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put("/profile", protect, upload.single("profilePic"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    if (req.body.privacy) {
      user.privacy = { ...user.privacy, ...JSON.parse(req.body.privacy) };
    }
    if (req.body.notifications) {
      user.notifications = { ...user.notifications, ...JSON.parse(req.body.notifications) };
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      userId: updatedUser.userId,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      profilePic: updatedUser.profilePic,
      privacy: updatedUser.privacy,
      notifications: updatedUser.notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Follow/Unfollow
router.put("/:id/follow", protect, async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser.followers.includes(req.user._id)) {
      await targetUser.updateOne({ $push: { followers: req.user._id } });
      await currentUser.updateOne({ $push: { following: req.params.id } });
      
      // Create notification
      await createNotification(req, {
        receiver: targetUser._id,
        type: "follow"
      });
      
      res.json({ message: "User followed" });
    } else {
      await targetUser.updateOne({ $pull: { followers: req.user._id } });
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      
      // Optionally delete notification
      await Notification.deleteOne({
        sender: req.user._id,
        receiver: targetUser._id,
        type: "follow"
      });
      
      res.json({ message: "User unfollowed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
