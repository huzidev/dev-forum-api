const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const authMiddleware = require('../middlewares/auth.middleware');
  
// Get user friends
router.get('/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const friends = await friendController.userFriends(parseInt(req.params.userId));
    res.json({ data: friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// is friend
// routes/friends.js (or wherever your friend-related routes live)
router.post('/is-friend', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await friendController.isFriend(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error in /is-friend route:", error);
    res.status(500).json({
      message: "Internal server error",
      isFriend: false,
    });
  }
});

// Get sent requests
router.get('/sent/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const requests = await friendController.sentRequests(req.params.userId);
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get received requests
router.get('/received/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const requests = await friendController.receivedRequests(req.params.userId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post('/sent-request', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await friendController.sentRequest(req.body);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/accept-request', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await friendController.acceptRequest(req.body);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete friendship
router.delete('/cancel-request', authMiddleware.authenticate, async (req, res) => {
  try {
    console.log("SW - Cancel friend request Called");

    const result = await friendController.cancelRequest(req.body);
    if (result) {
      return res.status(200).json({ status: result }); 
    } else {
      return res.status(404).json(null);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Delete/decline friend request
router.delete('/request/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const status = await friendController.deleteRequest(req.params.id);
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
