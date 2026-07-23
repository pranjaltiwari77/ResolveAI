const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  summary: {
    type: String,
  },
  importantFacts: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
}, { timestamps: true });

conversationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Conversation', conversationSchema);
