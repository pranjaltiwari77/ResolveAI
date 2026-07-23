const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// All ticket routes require authentication
router.use(authenticate);

router.post('/deflect', ticketController.deflectTicket);
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);

// Update a ticket (e.g. assign agent, change status)
router.put('/:id', requireRole(['admin', 'support_agent']), ticketController.updateTicket);

// Add a comment (internal or public)
router.post('/:id/comments', requireRole(['admin', 'support_agent', 'customer']), ticketController.addComment);

// Generate a draft reply
router.post('/:id/draft-reply', requireRole(['admin', 'support_agent']), ticketController.generateDraftReply);

// Delete a ticket
router.delete('/:id', requireRole(['admin']), ticketController.deleteTicket);

module.exports = router;
