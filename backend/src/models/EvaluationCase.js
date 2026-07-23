const mongoose = require('mongoose');

const evaluationCaseSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  expectedAnswer: {
    type: String,
    required: true,
  },
  expectedDocument: {
    type: String, // Name or ID of the document it should retrieve
  },
  requiredKeywords: {
    type: [String], // Keywords that MUST be in the answer
    default: [],
  },
  shouldRefuse: {
    type: Boolean, // True if the AI should refuse to answer
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('EvaluationCase', evaluationCaseSchema);
