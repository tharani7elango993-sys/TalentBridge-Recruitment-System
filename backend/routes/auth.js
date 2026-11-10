const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });

// ── POST /api/auth/register ──────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    if (role === 'admin')
      return res.status(403).json({ success: false, message: 'Cannot register as admin' });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: role || 'jobseeker', phone });
    res.status(201).json({
      success: true,
      token: makeToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });

    res.json({
      success: true,
      token: makeToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone,
        skills: user.skills, experience: user.experience,
        education: user.education, department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/profile ────────────────────────────────
router.get('/profile', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── PUT /api/auth/profile ────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, skills, experience, education, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, skills, experience, education, department },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/create-admin  (run once to seed admin) ──
router.post('/create-admin', async (req, res) => {
  try {
    if (await User.findOne({ role: 'admin' }))
      return res.status(400).json({ success: false, message: 'Admin already exists. Login with existing admin.' });
    const admin = await User.create({
      name: 'Admin', email: 'admin@talentbridge.com',
      password: 'admin123', role: 'admin'
    });
    res.json({ success: true, message: 'Admin created!', email: admin.email, password: 'admin123' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
