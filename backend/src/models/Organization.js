const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  settings: {
    type: Object,
    default: {},
  },
  dailyTokenLimit: {
    type: Number,
    default: 100000,
  },
  tokenUsage: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
