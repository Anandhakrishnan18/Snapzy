const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create a post
router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const newPost = new Post({
      user: req.user._id,
      content: req.body.content,
    });

    if (req.file) {
      newPost.media = `/uploads/${req.file.filename}`;
      newPost.mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const savedPost = await newPost.save();
    await savedPost.populate("user", "userId username profilePic");
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get feed (posts from followings + own posts)
router.get("/feed", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following;
    followingIds.push(req.user._id); // Include own posts

    const posts = await Post.find({ user: { $in: followingIds } })
      .populate("user", "userId username profilePic")
      .populate("comments.user", "userId username profilePic")
      .sort("-createdAt");

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Discover posts (latest public posts with media)
router.get("/discover", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 28;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ media: { $exists: true, $ne: "" } })
      .populate("user", "userId username profilePic")
      .populate("comments.user", "userId username profilePic")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a post
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like/Unlike a post
router.put("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.user._id)) {
      await post.updateOne({ $push: { likes: req.user._id } });
      res.json({ message: "Post liked" });
    } else {
      await post.updateOne({ $pull: { likes: req.user._id } });
      res.json({ message: "Post unliked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Comment on a post
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: req.user._id,
      text: req.body.text
    };

    post.comments.push(newComment);
    await post.save();
    
    await post.populate("comments.user", "userId username profilePic");
    res.status(201).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a comment
router.delete("/:id/comment/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const commentIndex = post.comments.findIndex(c => c._id.toString() === req.params.commentId);
    if (commentIndex === -1) return res.status(404).json({ message: "Comment not found" });

    if (post.comments[commentIndex].user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "User not authorized" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
