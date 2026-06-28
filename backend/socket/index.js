const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const onlineUsers = new Map();

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    
    // Broadcast online status
    io.emit("userOnline", userId);

    socket.on("sendMessage", (data) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", data.message);
      }
    });

    socket.on("typing", (data) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { userId: data.senderId });
      }
    });

    socket.on("stopTyping", (data) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userStoppedTyping", { userId: data.senderId });
      }
    });

    socket.on("markSeen", async (data) => {
      const { senderId, receiverId } = data;
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", { receiverId });
      }
    });

    socket.on("messageDelivered", async (data) => {
      const { senderId, messageId } = data;
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", { messageId });
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (err) {}
      io.emit("userOffline", { userId, lastSeen: new Date() });
    });
  });

  io.onlineUsers = onlineUsers;
  return io;
};
