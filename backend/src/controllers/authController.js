const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'stocksense_hackathon_jwt_secret_key_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      algorithm: 'HS256',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { loginId, email, password } = req.body;

    const userExists = await User.findOne({
      $or: [{ loginId }, { email: email.toLowerCase() }],
    });

    if (userExists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with provided loginId or email already exists',
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      loginId,
      email,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Account created successfully',
        user: {
          id: user._id,
          loginId: user.loginId,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    const user = await User.findOne({
      $or: [{ loginId }, { email: loginId.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid login ID or password',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid login ID or password',
        },
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          loginId: user.loginId,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        loginId: req.user.loginId,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        message: 'If the account exists, a password reset link has been processed.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  logout,
};
