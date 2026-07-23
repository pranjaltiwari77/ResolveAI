const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authenticate } = require('../middlewares/authMiddleware');

// All article routes require authentication
router.use(authenticate);

// Must be before /:id to avoid conflict
router.post('/generate', articleController.generateArticleFromTicket);

router.get('/', articleController.getArticles);
router.get('/search', articleController.searchArticles);
router.post('/', articleController.createArticle);
router.patch('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);

module.exports = router;
