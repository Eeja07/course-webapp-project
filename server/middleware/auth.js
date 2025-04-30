// middleware/auth.js - Authentication middleware
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Secret Key from environment variables for better security
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret'; // Use a strong secret key

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user; // Attach user info to the request
    next();
  });
};

module.exports = { 
  authenticateToken,
  JWT_SECRET
};