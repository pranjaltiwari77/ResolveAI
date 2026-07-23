const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  date: {
    type: Date, // We will truncate this to midnight to aggregate per day
    required: true,
  },
  type: {
    type: String,
    enum: ['triage', 'chat'],
    required: true,
  },
  promptTokens: {
    type: Number,
    default: 0,
  },
  completionTokens: {
    type: Number,
    default: 0,
  },
  totalTokens: {
    type: Number,
    default: 0,
  },
  apiCalls: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

// Ensure one log per organization per type per day
aiUsageLogSchema.index({ organizationId: 1, date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
