const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  knowledgeBaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // Array of floats
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

// We'll add the Atlas Vector Search index in the MongoDB UI or via shell,
// but for standard Mongoose queries we leave it as a regular array for now.

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
