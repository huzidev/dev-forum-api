const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await postController.getPosts();
    res.json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post by ID 
router.get('/:id', async (req, res) => {
  try {
    const post = await postController.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ data: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload image for post
router.post('/upload-image', async (req, res) => {
  try {
    const response = await postController.uploadPostImage(req);
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Image for post
router.patch('/:id/image', async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await postController.updatePostImage(req, postId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Update image error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a post
router.post('/create-post', authMiddleware.authenticate, async (req, res) => {
  try {
    const post = await postController.createPost(req.body);
    if (!post) {
      return res.status(400).json({ error: 'Failed to create post' });
    }
    res.json({ data: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a post
router.put('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const postData = { ...req.body, postId: req.params.id };
    const post = await postController.updatePost(postData);
    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }
    res.json({ data: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a post
router.delete('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await postController.deletePost(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await postController.getPostComments(req.params.id);
    res.json({ data: comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to post
router.post('/:id/comments', authMiddleware.authenticate, async (req, res) => {
  try {
    console.log("SW - Adding comment to post with ID:", req.params.id);
    const commentData = { ...req.body, postId: req.params.id };
    const comment = await postController.addComment(commentData);
    if (!comment) {
      return res.status(400).json({ error: 'Failed to add comment' });
    }
    res.json({ data: comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit comment
router.put('/comments/:commentId', authMiddleware.authenticate, async (req, res) => {
  try {
    const commentData = { ...req.body, commentId: req.params.commentId};
    const comment = await postController.editComment(commentData);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json({ data: comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
router.delete('/comments/:commentId', authMiddleware.authenticate, async (req, res) => {
  try {
    console.log("SW - Deleting comment with ID:", req.params.commentId);
    const result = await postController.deleteComment(req.params.commentId);
    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post likes
router.get('/:id/likes', async (req, res) => {
  try {
    const likes = await postController.getPostLikes(req.params.id);
    res.json({ data: likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like a post
router.post('/:id/like', authMiddleware.authenticate, async (req, res) => {
  try {
    const likeData = { ...req.body, postId: req.params.id };
    const result = await postController.likePost(likeData);
    if (!result) {
      return res.status(400).json({ error: 'Post already liked or error occurred' });
    }
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlike a post
router.delete('/:id/like', authMiddleware.authenticate, async (req, res) => {
  try {
    const likeData = { ...req.body, postId: req.params.id };
    const result = await postController.dislikePost(likeData);
    if (!result) {
      return res.status(400).json({ error: 'Post not liked or error occurred' });
    }
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get poll for a post
router.get('/:id/poll', async (req, res) => {
  try {
    const poll = await postController.getPoll(req.params.id);
    res.json({ data: poll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on poll
router.post('/:id/poll/vote', authMiddleware.authenticate, async (req, res) => {
  try {
    const voteData = { ...req.body, postId: req.params.id };
    const result = await postController.pollVote(voteData);
    if (!result) {
      return res.status(400).json({ error: 'Vote already exists or error occurred' });
    }
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save image to post
router.post('/:id/image', authMiddleware.authenticate, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const result = await postController.saveImage(imageUrl, req.params.id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes

// Update post status
router.put('/:id/status', authMiddleware.authenticate, async (req, res) => {
  try {
    const statusData = { ...req.body, postId: req.params.id };
    const result = await postController.updatePostStatus(statusData);
    if (!result) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update comment status
router.put('/comments/:commentId/status', authMiddleware.authenticate, async (req, res) => {
  try {
    const statusData = { ...req.body, commentId: req.params.commentId };
    const result = await postController.updateCommentStatus(statusData);
    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
