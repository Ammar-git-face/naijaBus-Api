const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminMiddleware');
const {
  getStats, getAllBookings, getAllUsers,
  getAllRoutes, createRoute, toggleRoute, deleteRoute,
  getAllBuses, createBus, updateBus, deleteBus,
  adminLogin, updateBookingTripStatus, getBookingDetail, getActivityFeed,
} = require('../controllers/adminController');

// Public — admin login only
router.post('/login', adminLogin);

// All routes below require admin JWT
router.use(adminProtect);

router.get('/stats', getStats);

router.get('/bookings', getAllBookings);
router.get('/bookings/:id', getBookingDetail);
router.patch('/bookings/:id/trip-status', updateBookingTripStatus);
router.get('/activity', getActivityFeed);

router.get('/users', getAllUsers);

router.get('/routes', getAllRoutes);
router.post('/routes', createRoute);
router.patch('/routes/:id/toggle', toggleRoute);
router.delete('/routes/:id', deleteRoute);

router.get('/buses', getAllBuses);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

module.exports = router;
