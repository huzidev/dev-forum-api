const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/points.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get user points
router.get('/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const points = await pointsController.getPoints(parseInt(req.params.userId));
    res.json({ data: points });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user points
router.post('/update-points', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await pointsController.updatePoints(req.body);
    if (!result) {
      return res.status(400).json({ error: 'Failed to update points' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
