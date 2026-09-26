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
    body('loginId')
      .trim()
      .isLength({ min: 6, max: 12 })
      .withMessage('Login ID must be between 6 and 12 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 9 })
      .withMessage('Password must be longer than 8 characters')
      .matches(/[a-z]/)
      .withMessage('Password must include a lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must include an uppercase letter')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must include a special character'),
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
