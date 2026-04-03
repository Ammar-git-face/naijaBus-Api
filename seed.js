require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const connectDB = require('./config/db');

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

// Major route pairs
const routePairs = [
  { from: 'Lagos', to: 'Abuja' },
  { from: 'Lagos', to: 'Ibadan' },
  { from: 'Lagos', to: 'Benin City' },
  { from: 'Lagos', to: 'Port Harcourt' },
  { from: 'Lagos', to: 'Enugu' },
  { from: 'Lagos', to: 'Owerri' },
  { from: 'Abuja', to: 'Lagos' },
  { from: 'Abuja', to: 'Kano' },
  { from: 'Abuja', to: 'Kaduna' },
  { from: 'Abuja', to: 'Jos' },
  { from: 'Abuja', to: 'Enugu' },
  { from: 'Abuja', to: 'Port Harcourt' },
  { from: 'Kano', to: 'Lagos' },
  { from: 'Kano', to: 'Abuja' },
  { from: 'Kano', to: 'Kaduna' },
  { from: 'Port Harcourt', to: 'Lagos' },
  { from: 'Port Harcourt', to: 'Abuja' },
  { from: 'Port Harcourt', to: 'Enugu' },
  { from: 'Port Harcourt', to: 'Owerri' },
  { from: 'Enugu', to: 'Lagos' },
  { from: 'Enugu', to: 'Abuja' },
  { from: 'Enugu', to: 'Port Harcourt' },
  { from: 'Enugu', to: 'Onitsha' },
  { from: 'Delta', to: 'Imo' },
  { from: 'Delta', to: 'Lagos' },
  { from: 'Delta', to: 'Abuja' },
  { from: 'Imo', to: 'Lagos' },
  { from: 'Imo', to: 'Abuja' },
  { from: 'Imo', to: 'Delta' },
  { from: 'Ibadan', to: 'Lagos' },
  { from: 'Ibadan', to: 'Abuja' },
  { from: 'Kaduna', to: 'Kano' },
  { from: 'Kaduna', to: 'Abuja' },
  { from: 'Benin City', to: 'Lagos' },
  { from: 'Benin City', to: 'Abuja' },
];

const busCompanies = [
  { name: 'GUO Transport', basePrice: 7000 },
  { name: 'Peace Mass Transit', basePrice: 9000 },
  { name: 'ABC Transport', basePrice: 11000 },
  { name: 'Chisco Transport', basePrice: 8500 },
  { name: 'Ekene Dili Chukwu', basePrice: 7500 },
  { name: 'Libra Express', basePrice: 10000 },
  { name: 'Goziem Transport', basePrice: 6500 },
  { name: 'Cross Country', basePrice: 12000 },
];

const schedules = [
  { departure: '06:00', arrival: '10:00' },
  { departure: '07:30', arrival: '12:00' },
  { departure: '09:00', arrival: '14:00' },
  { departure: '12:00', arrival: '18:00' },
  { departure: '14:00', arrival: '20:00' },
  { departure: '21:00', arrival: '05:00' },
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Route.deleteMany({});
    await Bus.deleteMany({});
    console.log('Cleared existing routes and buses');

    // Create routes
    const createdRoutes = [];
    for (const pair of routePairs) {
      try {
        const route = await Route.create({ from: pair.from, to: pair.to });
        createdRoutes.push(route);
      } catch (e) {
        // Skip duplicate
      }
    }
    console.log(`Created ${createdRoutes.length} routes`);

    // Create buses for each route (2-4 buses per route)
    let busCount = 0;
    for (const route of createdRoutes) {
      const numBuses = randomBetween(2, 4);
      const selectedSchedules = schedules.sort(() => 0.5 - Math.random()).slice(0, numBuses);
      const selectedCompanies = busCompanies.sort(() => 0.5 - Math.random()).slice(0, numBuses);

      for (let i = 0; i < numBuses; i++) {
        const company = selectedCompanies[i];
        const schedule = selectedSchedules[i];
        const priceVariance = randomBetween(-1000, 3000);
        await Bus.create({
          name: company.name,
          route: route._id,
          departureTime: schedule.departure,
          arrivalTime: schedule.arrival,
          totalSeats: randomBetween(33, 54),
          pricePerSeat: company.basePrice + priceVariance,
        });
        busCount++;
      }
    }

    console.log(`Created ${busCount} buses`);

    // Create default super admin if not exists
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({
        name: 'Amar Hussaini',
        email: 'Amarhussaini72@gmail.com',
        phone: '+2348137477803',
        password: 'Naija/#/123',
        role: 'admin',
      });
      console.log('Super admin created: admin@naijabus.ng / Admin@12345');
    } else {
      console.log('Admin already exists');
    }
    console.log('✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
