const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookingByReference, getBookingById, cancelBooking, completeBooking } = require('../controllers/bookingController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, createBooking);        // optionalAuth attaches userId if logged in
router.get('/my', protect, getMyBookings);            // protected — logged-in users only
router.get('/ref/:reference', getBookingByReference); // public — for success page
router.get('/:id', getBookingById);

router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/complete', protect, completeBooking);

module.exports = router;
