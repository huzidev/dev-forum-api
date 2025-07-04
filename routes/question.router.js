const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all questions
router.get('/', async (req, res) => {
  try {
    const filterWarning = req.query.filterWarning !== 'false';
    const questions = await questionController.getQuestions(filterWarning);
    res.json({ data: questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get question by ID
router.get('/:id', async (req, res) => {
  try {
    const question = await questionController.getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ data: question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get questions by user
router.get('/user/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const questions = await questionController.getQuestionsByUser(parseInt(req.params.userId));
    res.json({ data: questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ask a question
router.post('/ask', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await questionController.askQuestion(req.body);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a question
router.put('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const questionData = { ...req.body, questionId: req.params.id };
    const result = await questionController.editQuestion(questionData);
    if (!result) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a question
router.delete('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await questionController.deleteQuestion(req.params.id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Thread routes

// Get thread by ID
router.get('/threads/:id', async (req, res) => {
  try {
    const thread = await questionController.getThreadById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post thread to a question
router.post('/:id/post-thread', authMiddleware.authenticate, async (req, res) => {
  try {
    const threadData = { ...req.body, questionId: req.params.id };
    const result = await questionController.postThread(threadData);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a thread
router.put('/edit-thread/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const threadData = { ...req.body, threadId: req.params.id };
    const result = await questionController.editThread(threadData);
    if (!result) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a thread
router.delete('/delete-thread/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await questionController.deleteThread(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark thread as solved
router.post('/threads/:id/solve', authMiddleware.authenticate, async (req, res) => {
  try {
    const result = await questionController.markAsSolved(req.params.id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes

// Update question status
router.put('/:id/status', authMiddleware.authenticate, async (req, res) => {
  try {
    const statusData = { ...req.body, questionId: req.params.id };
    const result = await questionController.updateQuestionStatus(statusData);
    if (!result) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
