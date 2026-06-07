const jwt = require('jsonwebtoken');
const { findUserById } = require('../utils/userHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'manual-upload-secret';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    if (user.blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized access.' });
  }
}

module.exports = authMiddleware;
