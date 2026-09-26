const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authorized to access this route. No token provided.',
      },
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'stocksense_hackathon_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User no longer exists.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authorized. Invalid or expired token.',
      },
    });
  }
};

module.exports = { protect };
