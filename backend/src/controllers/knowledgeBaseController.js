const KnowledgeBase = require('../models/KnowledgeBase');
const Document = require('../models/Document');
const { addDocumentToQueue } = require('../workers/documentWorker');

exports.createKnowledgeBase = async (req, res) => {
  try {
    const { name, description } = req.body;
    const kb = new KnowledgeBase({
      name,
      description,
      organizationId: req.user.organizationId,
      createdBy: req.user.userId,
    });
    await kb.save();
    res.status(201).json(kb);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create knowledge base', error: error.message });
  }
};

exports.getKnowledgeBases = async (req, res) => {
  try {
    const kbs = await KnowledgeBase.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 });
    res.status(200).json(kbs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch knowledge bases', error: error.message });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ 
      knowledgeBaseId: req.params.id, 
      organizationId: req.user.organizationId 
    }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const doc = new Document({
      organizationId: req.user.organizationId,
      knowledgeBaseId: req.params.id,
      title: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      storagePath: req.file.path,
      uploadedBy: req.user.userId,
      status: 'Uploaded',
    });

    await doc.save();

    // Add to async processing queue
    addDocumentToQueue(doc._id);

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload document', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.docId,
      organizationId: req.user.organizationId,
      knowledgeBaseId: req.params.id
    });
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Also delete chunks
    const DocumentChunk = require('../models/DocumentChunk');
    await DocumentChunk.deleteMany({ documentId: doc._id });

    // In a real app, you would also delete the file from the filesystem/S3 here

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};
