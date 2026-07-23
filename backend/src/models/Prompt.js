const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['chat', 'triage', 'evaluation', 'other'],
    default: 'chat'
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  systemInstruction: {
    type: String,
    required: true,
  },
  inputTemplate: {
    type: String,
    default: '{{question}}'
  },
  outputSchema: {
    type: String, // Can be JSON string or standard text description
  },
  model: {
    type: String,
    default: 'gemini-3.1-flash-lite'
  },
  temperature: {
    type: Number,
    default: 0.2
  },
  maxTokens: {
    type: Number,
    default: 2048
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, { timestamps: true });

// Prevent multiple active prompts for the same purpose in an organization
// This will be handled in the controller logic by setting others to false when one is activated.

module.exports = mongoose.model('Prompt', promptSchema);
