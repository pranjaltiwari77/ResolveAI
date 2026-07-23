const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(requireRole(['admin']));

router.route('/')
  .get(promptController.getPrompts)
  .post(promptController.createPrompt);

router.post('/:id/activate', promptController.activatePrompt);

module.exports = router;
