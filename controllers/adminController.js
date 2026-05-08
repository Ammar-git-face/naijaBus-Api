const User = require('../models/User');
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// ─── Dashboard Overview Stats ──────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalBookings, totalRoutes, totalBuses] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments  (),
      Route.countDocuments({ isActive: true }),
      Bus.countDocuments({ isActive: true }),
    ]);

    // Revenue from paid bookings
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Bookings by payment status
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]);

    // Bookings by trip status
    const bookingsByTripStatus = await Booking.aggregate([
      { $group: { _id: '$tripStatus', count: { $sum: 1 } } },
    ]);

    // Revenue last 7 days (daily breakdown)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 5 routes by bookings
    const topRoutes = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $lookup: { from: 'buses', localField: 'bus', foreignField: '_id', as: 'bus' } },
      { $unwind: '$bus' },
      { $lookup: { from: 'routes', localField: 'bus.route', foreignField: '_id', as: 'route' } },
      { $unwind: '$route' },
      {
        $group: {
          _id: { from: '$route.from', to: '$route.to' },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
    ]);

    // Recent bookings
    const recentBookings = await Booking.find({ paymentStatus: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'bus', populate: { path: 'route' } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalRoutes,
        totalBuses,
        totalRevenue,
        paidBookings: bookingsByStatus.find((b) => b._id === 'paid')?.count || 0,
        pendingBookings: bookingsByStatus.find((b) => b._id === 'pending')?.count || 0,
        failedBookings: bookingsByStatus.find((b) => b._id === 'failed')?.count || 0,
        upcomingTrips: bookingsByTripStatus.find((b) => b._id === 'upcoming')?.count || 0,
        completedTrips: bookingsByTripStatus.find((b) => b._id === 'completed')?.count || 0,
        cancelledTrips: bookingsByTripStatus.find((b) => b._id === 'cancelled')?.count || 0,
        upcomingTrips: bookingsByTripStatus.find((b) => b._id === 'upcoming')?.count || 0,
        completedTrips: bookingsByTripStatus.find((b) => b._id === 'completed')?.count || 0,
        cancelledTrips: bookingsByTripStatus.find((b) => b._id === 'cancelled')?.count || 0,
        dailyRevenue,
        topRoutes,
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── All Bookings ──────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const { status, tripStatus, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status && status !== 'all') query.paymentStatus = status;
    if (tripStatus && tripStatus !== 'all') query.tripStatus = tripStatus;
    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'passenger.name': { $regex: search, $options: 'i' } },
        { 'passenger.email': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({ path: 'bus', populate: { path: 'route' } })
      .populate('user', 'name email');

    res.json({
      success: true,
      data: bookings,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── All Users ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password');

    // Attach booking count per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ user: user._id });
        const totalSpent = await Booking.aggregate([
          { $match: { user: user._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        return {
          ...user.toJSON(),
          bookingCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Routes Management ─────────────────────────────────────
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ from: 1 });
    // Attach bus count per route
    const routesWithStats = await Promise.all(
      routes.map(async (route) => {
        const busCount = await Bus.countDocuments({ route: route._id, isActive: true });
        const bookingCount = await Booking.aggregate([
          { $lookup: { from: 'buses', localField: 'bus', foreignField: '_id', as: 'bus' } },
          { $unwind: '$bus' },
          { $match: { 'bus.route': route._id, paymentStatus: 'paid' } },
          { $count: 'total' },
        ]);
        return { ...route.toJSON(), busCount, bookingCount: bookingCount[0]?.total || 0 };
      })
    );
    res.json({ success: true, data: routesWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRoute = async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ success: false, message: 'From and To are required' });
    const route = await Route.create({ from, to });
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'This route already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    route.isActive = !route.isActive;
    await route.save();
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRoute = async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Route deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Buses Management ──────────────────────────────────────
const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate('route').sort({ createdAt: -1 });
    res.json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBus = async (req, res) => {
  try {
    const { name, routeId, departureTime, arrivalTime, totalSeats, pricePerSeat } = req.body;
    if (!name || !routeId || !departureTime || !arrivalTime || !totalSeats || !pricePerSeat) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const bus = await Bus.create({ name, route: routeId, departureTime, arrivalTime, totalSeats, pricePerSeat });
    const populated = await bus.populate('route');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBus = async (req, res) => {
  try {
    const { name, departureTime, arrivalTime, totalSeats, pricePerSeat, isActive } = req.body;
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { name, departureTime, arrivalTime, totalSeats, pricePerSeat, isActive },
      { new: true }
    ).populate('route');
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBus = async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bus deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin login (returns token only if admin) ─────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ success: true, token, admin: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── Update trip status from admin ────────────────────────
const updateBookingTripStatus = async (req, res) => {
  try {
    const { tripStatus } = req.body;
    const validStatuses = ['upcoming', 'completed', 'cancelled'];
    if (!validStatuses.includes(tripStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid trip status' });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { tripStatus },
      { new: true }
    ).populate({ path: 'bus', populate: { path: 'route' } });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get single booking detail ─────────────────────────────
const getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'bus', populate: { path: 'route' } })
      .populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Recent activity feed ──────────────────────────────────
const getActivityFeed = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ updatedAt: -1 })
      .limit(30)
      .populate({ path: 'bus', populate: { path: 'route' } })
      .populate('user', 'name email');
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  getStats, getAllBookings, getAllUsers,
  getAllRoutes, createRoute, toggleRoute, deleteRoute,
  getAllBuses, createBus, updateBus, deleteBus,
  adminLogin, updateBookingTripStatus, getBookingDetail, getActivityFeed,
};
