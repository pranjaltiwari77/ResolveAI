const Article = require('../models/Article');
const { generateArticle, semanticSearchArticles } = require('../services/aiService');

// GET all articles for the org
exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find({ organizationId: req.user.organizationId })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch articles', error: error.message });
  }
};

// GET search articles via Semantic AI
exports.searchArticles = async (req, res) => {
  try {
    const { q } = req.query;
    const allArticles = await Article.find({ organizationId: req.user.organizationId }).populate('authorId', 'name email');
    
    if (!q || q.trim() === '') {
      return res.status(200).json(allArticles);
    }

    const matchedIds = await semanticSearchArticles(q, allArticles);
    
    if (!matchedIds || matchedIds.length === 0) {
      return res.status(200).json([]);
    }

    // Map matched IDs back to full article objects, preserving order
    const matchedArticles = matchedIds
      .map(id => allArticles.find(a => a._id.toString() === id))
      .filter(Boolean); // Filter out any undefined just in case

    res.status(200).json(matchedArticles);
  } catch (error) {
    res.status(500).json({ message: 'Semantic search failed', error: error.message });
  }
};

// POST create new article (manual)
exports.createArticle = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const article = new Article({
      title,
      content,
      category: category || 'General',
      organizationId: req.user.organizationId,
      authorId: req.user._id,
    });
    await article.save();
    await article.populate('authorId', 'name email');
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create article', error: error.message });
  }
};

// POST generate article from ticket insights via AI
exports.generateArticleFromTicket = async (req, res) => {
  try {
    const { title, insights, category } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required for generation' });
    }

    const content = await generateArticle(title, insights || {});

    const article = new Article({
      title,
      content,
      category: category || insights?.category || 'General',
      organizationId: req.user.organizationId,
      authorId: req.user._id,
    });

    await article.save();
    await article.populate('authorId', 'name email');
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate article', error: error.message });
  }
};

// PATCH update an article
exports.updateArticle = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $set: { title, content, category } },
      { new: true }
    ).populate('authorId', 'name email');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update article', error: error.message });
  }
};

// DELETE an article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete article', error: error.message });
  }
};
