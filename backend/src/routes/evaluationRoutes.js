const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(requireRole(['admin']));

router.route('/cases')
  .get(evaluationController.getCases)
  .post(evaluationController.createCase);

router.route('/runs')
  .get(evaluationController.getRuns);

router.post('/run', evaluationController.runEvaluation);

module.exports = router;
