const express = require('express');
const router = express.Router();
const { initializePayment, verifyPayment, getPaymentStatus, resendTicketEmail } = require('../controllers/paymentController');

router.post('/initialize', initializePayment);
router.get('/verify', verifyPayment);             // Flutterwave redirect URL
router.get('/status/:ref', getPaymentStatus);
router.post('/resend/:ref', resendTicketEmail);   // Resend ticket to email

module.exports = router;
