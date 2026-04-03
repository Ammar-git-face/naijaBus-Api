const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. Admin access only.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }

    req.userId = user._id;
    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

module.exports = { adminProtect };
