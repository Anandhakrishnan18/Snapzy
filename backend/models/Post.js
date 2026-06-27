const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    trim: true,
  },
  media: {
    type: String,
    default: "", // URL or path to media file
  },
  mediaType: {
    type: String,
    enum: ["image", "video", "none"],
    default: "none",
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  comments: [CommentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
