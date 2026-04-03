const express = require('express');
const router = express.Router();
const { searchBuses, getBusSeats } = require('../controllers/busController');

router.get('/search', searchBuses);
router.get('/:busId/seats', getBusSeats);

module.exports = router;
