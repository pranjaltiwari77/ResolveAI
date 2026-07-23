const mongoose = require('mongoose');

const pendingActionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  },
  functionName: {
    type: String,
    required: true,
  },
  arguments: {
    type: Object,
    default: {},
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'executed', 'failed'],
    default: 'pending',
  },
  requestedByAI: {
    type: Boolean,
    default: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  result: {
    type: Object, // Could store the JSON response of the executed function
  },
  executedAt: {
    type: Date,
  },
}, { timestamps: true });

// Virtual id field
pendingActionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('PendingAction', pendingActionSchema);
