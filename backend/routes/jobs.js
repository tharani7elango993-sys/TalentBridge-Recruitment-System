const express = require('express');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/jobs  (public – with search & filter) ───────
router.get('/', async (req, res) => {
  try {
    const { search, jobType, location } = req.query;
    let q = { status: 'open' };
    if (search) q.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { skills: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
    if (jobType)   q.jobType  = jobType;
    if (location)  q.location = { $regex: location, $options: 'i' };

    const jobs = await Job.find(q)
      .populate('postedBy', 'name email department company')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/jobs/my  (HR – own postings) ────────────────
router.get('/my', protect, authorize('hr', 'admin'), async (req, res) => {
  try {
    const q = req.user.role === 'admin' ? {} : { postedBy: req.user._id };
    const jobs = await Job.find(q).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/jobs/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email department');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/jobs  (HR / Admin only) ────────────────────
router.post('/', protect, authorize('hr', 'admin'), async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      postedBy: req.user._id,
      company: req.user.company || req.body.company || 'TalentBridge Corp'
    });
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/jobs/:id  (HR own / Admin) ──────────────────
router.put('/:id', protect, authorize('hr', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (req.user.role === 'hr' && job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized to edit this job' });

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, job: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/jobs/:id ─────────────────────────────────
router.delete('/:id', protect, authorize('hr', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (req.user.role === 'hr' && job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
