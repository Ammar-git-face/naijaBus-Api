const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    trim: true,
  },
  to: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Prevent duplicate routes
routeSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Route', routeSchema);
