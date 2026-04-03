const QRCode = require('qrcode');

// Generate a QR code as base64 string
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#276749',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

module.exports = { generateQRCode };
