const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);

router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/stream', chatController.sendMessageStream);
router.post('/conversations/:conversationId/escalate', chatController.escalateConversation);
router.put('/messages/:messageId/rate', chatController.rateMessage);

module.exports = router;
