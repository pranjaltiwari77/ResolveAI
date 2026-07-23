const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'support_agent', 'customer'],
    default: 'customer',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationOtp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  refreshTokens: [{
    type: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
