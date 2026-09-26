const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  forgotPassword,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('loginId').trim().notEmpty().withMessage('loginId is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('loginId').trim().notEmpty().withMessage('loginId is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
