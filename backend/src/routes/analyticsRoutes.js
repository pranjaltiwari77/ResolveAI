const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/overview', analyticsController.getOverview);

module.exports = router;
