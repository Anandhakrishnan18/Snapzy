const Notification = require("../models/Notification");
const User = require("../models/User");

const createNotification = async (req, { receiver, type, post = null }) => {
  // Don't notify yourself
  if (receiver.toString() === req.user._id.toString()) return null;

  try {
    const notification = new Notification({
      sender: req.user._id,
      receiver,
      type,
      post
    });
    await notification.save();

    // Populate for socket emission
    await notification.populate("sender", "userId username profilePic");
    if (post) {
      await notification.populate("post", "content media");
    }

    // Emit via socket
    const receiverSocketId = req.io.onlineUsers.get(receiver.toString());
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("newNotification", notification);
    }

    return notification;
  } catch (err) {
    console.error("Error creating notification", err);
    return null;
  }
};

module.exports = { createNotification };
