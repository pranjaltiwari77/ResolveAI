const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Approve or reject a pending action
router.post('/:id/approve', actionController.approveAction);
router.post('/:id/reject', actionController.rejectAction);

module.exports = router;
