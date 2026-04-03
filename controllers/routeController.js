const Route = require('../models/Route');

// Get all unique departure cities
const getDepartureCities = async (req, res) => {
  try {
    const cities = await Route.distinct('from', { isActive: true });
    res.json({ success: true, data: cities.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get destinations based on selected departure
const getDestinations = async (req, res) => {
  try {
    const { from } = req.params;
    const routes = await Route.find({ from, isActive: true });
    const destinations = routes.map((r) => r.to).sort();
    res.json({ success: true, data: destinations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).sort('from');
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDepartureCities, getDestinations, getAllRoutes };
