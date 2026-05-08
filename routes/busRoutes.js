const express = require('express');
const router = express.Router();
const { searchBuses, getBusSeats } = require('../controllers/busController');

router.post('/search', searchBuses);
router.post('/seats', getBusSeats);

module.exports = router;
