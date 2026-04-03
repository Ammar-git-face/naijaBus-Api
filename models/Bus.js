const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  departureTime: {
    type: String,
    required: true, // e.g. "06:00"
  },
  arrivalTime: {
    type: String,
    required: true, // e.g. "10:00"
  },
  totalSeats: {
    type: Number,
    required: true,
    default: 45,
  },
  pricePerSeat: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
