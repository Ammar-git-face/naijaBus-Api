const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const routeRoutes = require('./routes/routeRoutes');
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const seed = require('./seed');

const app = express();
// seed()
// Connect to MongoDB
connectDB();
seed();
// Middleware
app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NaijaBus API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`🚌 NaijaBus server running on http://localhost:${PORT}`);
});

module.exports = app;
