const Booking = require('../models/Booking');
const Bus = require('../models/Bus');

// Create a new booking (status = pending until payment)
const createBooking = async (req, res) => {
  try {
    const { busId, travelDate, seatNumber, fullName, email, phone } = req.body;

    if (!busId  || !travelDate || !seatNumber || !fullName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    const bus = await Bus.findById(busId).populate('route');
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const existingBooking = await Booking.findOne({
      bus: busId,
      travelDate,
      seatNumber,
      paymentStatus: { $in: ['pending', 'paid'] },
    });

    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'This seat is already taken. Please select another.' });
    }

    const booking = await Booking.create({
      bus: busId,
      travelDate,
      seatNumber,
      totalAmount: bus.pricePerSeat,
      fullName,
      email,
      phone
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all bookings for the logged-in user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate({ path: 'bus', populate: { path: 'route' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get booking by reference (public)
const getBookingByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    const booking = await Booking.findOne({ bookingReference: reference }).populate({
      path: 'bus',
      populate: { path: 'route' },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'bus',
      populate: { path: 'route' },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel a booking (user can only cancel their own upcoming paid bookings)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only the owner can cancel
    if (booking.user?.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Only paid bookings can be cancelled' });
    }
    if (booking.tripStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }
    if (booking.tripStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed trips cannot be cancelled' });
    }

    booking.tripStatus = 'cancelled';
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a booking as completed (user confirms trip done)
const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.user?.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Only paid bookings can be marked complete' });
    }
    if (booking.tripStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled bookings cannot be completed' });
    }
    if (booking.tripStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Already marked as completed' });
    }

    booking.tripStatus = 'completed';
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, getBookingByReference, getBookingById, cancelBooking, completeBooking };
