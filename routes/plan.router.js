const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all plans
router.get('/', async (req, res) => {
  try {
    const plans = await planController.getPlans();
    res.json({ data: plans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await planController.getPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ data: plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy a plan
router.post('/buy', authMiddleware.authenticate, async (req, res) => {
  try {
    const { planId, userId } = req.body;
    const result = await planController.buyPlan(planId, userId);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes

// Create a plan
router.post('/create-plan', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await planController.createPlan(req.body);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a plan
router.put('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const planData = { ...req.body, id: req.params.id };
    const result = await planController.updatePlan(planData);
    if (!result) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a plan
router.delete('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await planController.deletePlan(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
