const axios = require('axios');
const Booking = require('../models/Booking');
const { generateQRCode } = require('../services/qrService');
const { sendTicketEmail } = require('../services/emailService');

const initializePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate({ path: 'bus', populate: { path: 'route' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    const payload = {
      tx_ref: booking.bookingReference,
      amount: booking.totalAmount,
      currency: 'NGN',
      redirect_url: `${process.env.APP_URL}/api/payment/verify`,
      customer: { email: booking.passenger.email, name: booking.passenger.name, phone_number: booking.passenger.phone },
      customizations: { title: 'NaijaBus Ticket', description: `Ticket for ${booking.bus.route.from} → ${booking.bus.route.to}` },
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
    });

    res.json({ success: true, paymentLink: response.data.data.link });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { tx_ref, status, transaction_id } = req.query;
    if (status !== 'successful') return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?ref=${tx_ref}`);

    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    });

    const txData = response.data.data;
    if (txData.status !== 'successful' || txData.tx_ref !== tx_ref) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?ref=${tx_ref}`);
    }

    const booking = await Booking.findOneAndUpdate(
      { bookingReference: tx_ref },
      { paymentStatus: 'paid', flutterwaveRef: transaction_id },
      { new: true }
    ).populate({ path: 'bus', populate: { path: 'route' } });

    if (!booking) return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?ref=${tx_ref}`);

    const qrData = JSON.stringify({ ref: booking.bookingReference, passenger: booking.passenger.name, route: `${booking.bus.route.from} → ${booking.bus.route.to}`, date: booking.travelDate, seat: booking.seatNumber, bus: booking.bus.name });
    const qrCodeBase64 = await generateQRCode(qrData);
    booking.qrCodeData = qrCodeBase64;
    await booking.save();

    await sendTicketEmail(booking, qrCodeBase64);
    res.redirect(`${process.env.FRONTEND_URL}/booking-success?ref=${booking.bookingReference}`);
  } catch (error) {
    console.error('Payment verification error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { ref } = req.params;
    const booking = await Booking.findOne({ bookingReference: ref }).populate({ path: 'bus', populate: { path: 'route' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: { status: booking.paymentStatus, booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resendTicketEmail = async (req, res) => {
  try {
    const { ref } = req.params;
    const booking = await Booking.findOne({ bookingReference: ref }).populate({ path: 'bus', populate: { path: 'route' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.paymentStatus !== 'paid') return res.status(400).json({ success: false, message: 'Ticket not yet paid' });

    if (!booking.qrCodeData) {
      const qrData = JSON.stringify({ ref: booking.bookingReference, passenger: booking.passenger.name, route: `${booking.bus.route.from} → ${booking.bus.route.to}`, date: booking.travelDate, seat: booking.seatNumber, bus: booking.bus.name });
      booking.qrCodeData = await generateQRCode(qrData);
      await booking.save();
    }

    await sendTicketEmail(booking, booking.qrCodeData);
    res.json({ success: true, message: `Ticket resent to ${booking.passenger.email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initializePayment, verifyPayment, getPaymentStatus, resendTicketEmail };
