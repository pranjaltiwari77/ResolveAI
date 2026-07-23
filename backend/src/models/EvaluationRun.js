const mongoose = require('mongoose');

const evaluationResultSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationCase' },
  question: String,
  aiAnswer: String,
  isCorrect: Boolean,
  hasCorrectCitation: Boolean,
  refusalAccurate: Boolean,
  tokensUsed: Number,
  responseTimeMs: Number,
}, { _id: false });

const evaluationRunSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  promptVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prompt', // The prompt version used for this run
    required: true,
  },
  results: [evaluationResultSchema],
  correctnessScore: Number, // Percentage 0-100
  citationScore: Number, // Percentage 0-100
  refusalScore: Number, // Percentage 0-100
  averageResponseTime: Number, // in ms
  totalTokens: Number,
  estimatedCost: Number, // in USD
}, { timestamps: true });

module.exports = mongoose.model('EvaluationRun', evaluationRunSchema);
