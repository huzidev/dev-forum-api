const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {authenticate} = require('../middlewares/auth.middleware');

// Get all users
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await userController.getUsers();
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrolled users
router.get('/enrolled', authenticate, async (req, res) => {
  try {
    const users = await userController.getEnrolledUsers();
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await userController.getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by Clerk ID
router.get('/clerk/:userId', authenticate, async (req, res) => {
  try {
    const user = await userController.getUserByClerkId(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user points
router.get('/:id/points', authenticate, async (req, res) => {
  try {
    const points = await userController.getUserPoints(req.params.id);
    if (!points) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user friends
router.get('/:id/friends', authenticate, async (req, res) => {
  try {
    const friends = await userController.getUserFriends(req.params.id);
    if (!friends) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user if not exists
router.post('/create', async (req, res) => {
  try {
    const result = await userController.createUserIfNotExists(req.body);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const userData = { ...req.body, userId: req.params.userId };
    const result = await userController.updateUser(userData);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:userId', authenticate, async (req, res) => {
  try {
    const result = await userController.deleteUser(req.params.userId);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes

// Update user enrollment status
router.put('/:id/enrollment', authenticate, async (req, res) => {
  try {
    const { state } = req.body;
    const result = await userController.updateUserRole(parseInt(req.params.id), state);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user ban status
router.put('/:id/ban', authenticate, async (req, res) => {
  try {
    const { state } = req.body;
    const result = await userController.updateUserState(parseInt(req.params.id), state);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;