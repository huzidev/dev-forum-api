const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get notifications for a user
router.get('/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const notifications = await notificationController.getNotifications(userId, limit, offset);

    res.json({ data: notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a notification
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const notification = await notificationController.create(req.body);
    if (!notification) {
      return res.status(400).json({ error: 'User not found' });
    }
    res.json({ data: notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/mark-as-read', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await notificationController.markRead(req.params.id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notifications
router.delete('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }
    const result = await notificationController.remove(ids);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
