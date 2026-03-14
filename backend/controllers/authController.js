const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const config = require('../config');

exports.validate = (method) => {
  if (method === 'signup') {
    return [
      body('username').isLength({ min: 3 }).trim(),
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 8 })
    ];
  }
  return [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];
};

exports.signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Invalid request payload', 400, errors.array());

  const { username, email, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
  if (existing) throw new AppError('User with this email or username already exists', 409);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, password: hashed });

  res.status(201).json({ id: user._id, username: user.username, email: user.email });
});

exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Invalid request payload', 400, errors.array());

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, config.jwtSecret, {
    expiresIn: '7d'
  });

  res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
});
