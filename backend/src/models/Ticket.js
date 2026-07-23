const mongoose = require('mongoose');

const slaSchema = new mongoose.Schema({
  responseDue: { type: Date },
  resolutionDue: { type: Date },
  responseBreach: { type: Boolean, default: false },
  resolutionBreach: { type: Boolean, default: false },
  escalatedAt: { type: Date },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isAi && !this.isSystem; },
  },
  content: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isAi: {
    type: Boolean,
    default: false,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  attachmentUrl: {
    type: String,
  },
  attachmentType: {
    type: String, // 'image', 'audio', 'file'
  }
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  category: {
    type: String,
    default: 'Uncategorized',
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  aiInsights: {
    type: Object,
    default: {},
  },
  sla: {
    type: slaSchema,
    default: () => ({}),
  },
  initialAiCategory: {
    type: String, // Tracks the original AI guess for evaluation reporting
  },
  initialAiPriority: {
    type: String, // Tracks the original AI guess for evaluation reporting
  },
  metadata: {
    type: Object, // Holds any custom info like orderId or plan level
    default: {},
  },
  comments: [commentSchema],
}, { timestamps: true });

// Custom toJSON to format the 'id' field for frontend
ticketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);

