const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Profile routes (any authenticated user)
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);

// Team management (admin only)
router.get('/team', settingsController.getTeamMembers);
router.post('/team/invite', requireRole(['admin']), settingsController.inviteMember);
router.put('/team/:id/role', requireRole(['admin']), settingsController.updateMemberRole);
router.delete('/team/:id', requireRole(['admin']), settingsController.removeMember);

// Organization settings (admin only)
router.get('/org', settingsController.getOrgSettings);
router.put('/org', requireRole(['admin']), settingsController.updateOrgSettings);

module.exports = router;
