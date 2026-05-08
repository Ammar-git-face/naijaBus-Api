const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Booking = require('../models/Booking');

// Search available buses for a route and date
const searchBuses = async (req, res) => {
  try {
    const { from, to, date } = req.body;

    // if (!from || !to || !date) {
    //   return res.status(400).json({ success: false, message: 'from, to, and date are required' });
    // }

    // Find the route
    const route = await Route.findOne({ from, to, isActive: true });
    if (!route) {
      return res.json({ success: true, data: [] });
    }

    // Find buses on this route
    const buses = await Bus.find({ route: route._id, isActive: true });

    // For each bus, count booked seats on the given date
    const busesWithAvailability = await Promise.all(
      buses.map(async (bus) => {
        const bookedSeats = await Booking.find({
          bus: bus._id,
          travelDate: date,
          paymentStatus: { $in: ['pending', 'paid'] },
        }).select('seatNumber');

        const bookedSeatNumbers = bookedSeats.map((b) => b.seatNumber);
        const availableSeats = bus.totalSeats - bookedSeatNumbers.length;

        return {
          _id: bus._id,
          name: bus.name,
          departureTime: bus.departureTime,
          arrivalTime: bus.arrivalTime,
          totalSeats: bus.totalSeats,
          availableSeats,
          pricePerSeat: bus.pricePerSeat,
          route: { from, to },
        };
      })
    );

    // Sort by departure time
    busesWithAvailability.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    res.json({ success: true, data: busesWithAvailability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get seat availability for a specific bus on a specific date
const getBusSeats = async (req, res) => {
  try {
    // const { busId } = req.params.busId;
    const { date, busId } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const bookedSeats = await Booking.find({
      bus: busId,
      travelDate: date,
      paymentStatus: { $in: ['pending', 'paid'] },
    }).select('seatNumber');

    const takenSeats = bookedSeats.map((b) => b.seatNumber);

    res.json({
      success: true,
      data: {
        totalSeats: bus.totalSeats,
        takenSeats,
      },
    });
} catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { searchBuses, getBusSeats };
