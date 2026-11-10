const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/admin/stats ─────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalJobSeekers, totalHR, totalJobs, openJobs, totalApplications, selectedCandidates] =
      await Promise.all([
        User.countDocuments({ role: { $ne: 'admin' } }),
        User.countDocuments({ role: 'jobseeker' }),
        User.countDocuments({ role: 'hr' }),
        Job.countDocuments(),
        Job.countDocuments({ status: 'open' }),
        Application.countDocuments(),
        Application.countDocuments({ status: 'selected' })
      ]);
    res.json({ success: true, stats: { totalUsers, totalJobSeekers, totalHR, totalJobs, openJobs, totalApplications, selectedCandidates } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ─────────────────────────────────
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const q = role ? { role } : { role: { $ne: 'admin' } };
    const users = await User.find(q).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/admin/users/:id/toggle  (Activate / Deactivate) ──
router.put('/users/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/users/:id ──────────────────────────
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/create-hr ────────────────────────────
router.post('/create-hr', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already exists' });
    const hr = await User.create({ name, email, password, role: 'hr', department });
    res.status(201).json({
      success: true,
      user: { id: hr._id, name: hr.name, email: hr.email, role: hr.role, department: hr.department }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
