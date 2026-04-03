const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendTicketEmail = async (booking, qrCodeBase64) => {
  const transporter = createTransporter();

  const { passenger, bus, travelDate, seatNumber, bookingReference, totalAmount } = booking;

  // Format date nicely
  const formattedDate = new Date(travelDate).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Your NaijaBus E-Ticket</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: #276749; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 5px 0 0; opacity: 0.85; }
    .body { padding: 30px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
    .ticket-box { border: 2px dashed #276749; border-radius: 10px; padding: 20px; background: #f0f7f0; }
    .ticket-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .ticket-row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 14px; }
    .value { font-weight: bold; color: #333; font-size: 14px; }
    .total-row { margin-top: 10px; background: #276749; color: white; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; }
    .qr-section { text-align: center; margin: 25px 0; }
    .qr-section p { color: #666; font-size: 13px; margin-top: 8px; }
    .ref-badge { background: #276749; color: white; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin: 10px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    .note { background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚌 NaijaBus</h1>
      <p>Your E-Ticket is Ready!</p>
    </div>
    <div class="body">
      <p class="greeting">Dear <strong>${passenger.name}</strong>,<br/>
      Your booking is confirmed! Present the QR code below at the bus terminal.</p>

      <div class="ticket-box">
        <div class="ticket-row">
          <span class="label">Route</span>
          <span class="value">${bus.route.from} → ${bus.route.to}</span>
        </div>
        <div class="ticket-row">
          <span class="label">Date</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="ticket-row">
          <span class="label">Bus</span>
          <span class="value">${bus.name}</span>
        </div>
        <div class="ticket-row">
          <span class="label">Departure</span>
          <span class="value">${bus.departureTime} → ${bus.arrivalTime}</span>
        </div>
        <div class="ticket-row">
          <span class="label">Seat Number</span>
          <span class="value">Seat ${seatNumber}</span>
        </div>
        <div class="ticket-row">
          <span class="label">Passenger</span>
          <span class="value">${passenger.name}</span>
        </div>
        <div class="ticket-row">
          <span class="label">Phone</span>
          <span class="value">${passenger.phone}</span>
        </div>
      </div>

      <div style="text-align:center; margin: 16px 0;">
        <div class="total-row" style="display:inline-flex; min-width: 250px;">
          <span>Total Paid</span>
          <span>₦${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div class="qr-section">
        <p style="font-weight:bold; color:#333; margin-bottom:10px;">Your Booking Reference</p>
        <div class="ref-badge">${bookingReference}</div>
        <br/><br/>
        <img src="${qrCodeBase64}" alt="QR Code" width="200" height="200" style="border: 4px solid #276749; border-radius: 8px;" />
        <p>Scan this QR code at the terminal to board</p>
      </div>

      <div class="note">
        ⏰ <strong>Please arrive 30 minutes before departure.</strong> Bring a valid ID along with this ticket.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NaijaBus Ticketing System. All rights reserved.</p>
      <p>Need help? Contact support@naijabus.ng</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NaijaBus" <${process.env.EMAIL_USER}>`,
    to: passenger.email,
    subject: `Your NaijaBus Ticket — ${bookingReference}`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Ticket email sent to ${passenger.email}`);
};

module.exports = { sendTicketEmail };
