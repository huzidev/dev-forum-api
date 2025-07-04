const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bug.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// User routes
router.post('/report', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await bugController.reportBug(req.body);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const bugs = await bugController.getReportedBugsByUser(parseInt(req.params.userId));
    res.json({ data: bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
router.get('/get-reported-bugs', authMiddleware.authenticate, async (req, res) => {
  try {
    const bugs = await bugController.getReportedBugs();
    res.json({ data: bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const bug = await bugController.getReportedBugById(req.params.id);
    if (!bug) {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    res.json({ data: bug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/update-status', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await bugController.updateBugStatus(req.body);
    if (!result) {
      return res.status(404).json({ error: 'Bug report not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
