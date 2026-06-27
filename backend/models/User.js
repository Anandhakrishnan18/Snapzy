const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "",
    maxLength: 150,
  },
  profilePic: {
    type: String,
    default: "",
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  privacy: {
    isPrivate: { type: Boolean, default: false },
    showOnlineStatus: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    whoCanMessage: { type: String, enum: ["Everyone", "Followers", "Nobody"], default: "Everyone" },
    whoCanComment: { type: String, enum: ["Everyone", "Followers", "Nobody"], default: "Everyone" },
  },
  notifications: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    followers: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  lastSeen: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

UserSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
