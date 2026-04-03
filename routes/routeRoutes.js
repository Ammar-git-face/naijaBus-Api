const express = require('express');
const router = express.Router();
const { getDepartureCities, getDestinations, getAllRoutes } = require('../controllers/routeController');

router.get('/', getAllRoutes);
router.get('/departures', getDepartureCities);
router.get('/destinations/:from', getDestinations);

module.exports = router;
