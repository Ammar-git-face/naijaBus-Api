# 🚌 NaijaBus — Bus Ticketing System

Nigeria's trusted bus booking platform. Book bus tickets online with seat selection, Flutterwave payments, and QR code e-tickets delivered via email.

---

## 📁 Project Structure

```
naijabus/
├── backend/           # Express.js MVC API
│   ├── config/        # Database connection
│   ├── models/        # Mongoose models (Route, Bus, Booking)
│   ├── controllers/   # Business logic
│   ├── routes/        # API route definitions
│   ├── services/      # Email + QR code services
│   ├── middleware/    # Error handler
│   ├── server.js      # Entry point
│   └── seed.js        # Seed Nigerian routes & buses
│
└── frontend/          # Next.js 14 frontend
    ├── app/
    │   ├── page.js              # Landing page
    │   ├── book/
    │   │   ├── page.js          # Step 1: Route selection
    │   │   ├── buses/page.js    # Step 2: Bus selection
    │   │   ├── seats/page.js    # Step 3: Seat map
    │   │   ├── details/page.js  # Step 4: Passenger info
    │   │   └── summary/page.js  # Step 5: Booking summary
    │   ├── booking-success/     # Post-payment success
    │   └── payment-failed/      # Payment failure
    ├── components/
    │   ├── Navbar.js
    │   └── Stepper.js
    └── lib/
        └── api.js               # API utility functions
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Flutterwave account (for payments)
- Gmail account (for sending tickets)

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/naijabus
FRONTEND_URL=http://localhost:3000

# Gmail (use App Password — not your regular Gmail password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Flutterwave (from dashboard.flutterwave.com)
FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxx
FLW_SECRET_KEY=FLWSECK_TEST-xxxx
FLW_ENCRYPTION_KEY=xxxx

APP_URL=http://localhost:5000
```

Seed the database with Nigerian routes and buses:
```bash
npm run seed
```

Start the backend:
```bash
npm run dev       # Development (nodemon)
npm start         # Production
```

Backend runs at: **http://localhost:5000**

---