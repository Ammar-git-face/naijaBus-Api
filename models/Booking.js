const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true,
  },
  travelDate: {
    type: String, // stored as "YYYY-MM-DD" for easy querying
    required: true,
  },
  seatNumber: {
    type: Number,
    required: true,
  },
  passenger: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  bookingReference: {
    type: String,
    unique: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  tripStatus: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  flutterwaveRef: {
    type: String,
    default: null,
  },
  qrCodeData: {
    type: String, // base64 QR code image
    default: null,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

// Prevent double-booking same seat on same bus on same date
bookingSchema.index({ bus: 1, travelDate: 1, seatNumber: 1 }, { unique: true });

// Auto-generate booking reference before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'NJB-';
    for (let i = 0; i < 8; i++) {
      ref += chars[Math.floor(Math.random() * chars.length)];
    }
    this.bookingReference = ref;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
