const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema({
  documentName: String,
  pageNumber: Number,
  chunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentChunk' },
  excerpt: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  citations: {
    type: [citationSchema],
    default: [],
  },
  retrievedChunkIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentChunk',
  }],
  tokenUsage: {
    type: Number,
  },
  feedback: {
    type: String, // 'helpful', 'not-helpful', etc.
  },
}, { timestamps: true });

messageSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Message', messageSchema);
