const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  knowledgeBaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
  },
  category: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Uploaded', 'Processing', 'Ready', 'Failed', 'Archived'],
    default: 'Uploaded',
  },
  storagePath: {
    type: String, // Local path for now
  },
  processingError: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

documentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Document', documentSchema);
