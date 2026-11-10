const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');
const multer = require("multer");

const router = express.Router();


// ===== MULTER CONFIG =====
const storage = multer.diskStorage({
 destination: function (req, file, cb) {
  cb(null, "uploads/");
 },
 filename: function (req, file, cb) {
  cb(null, Date.now() + "-" + file.originalname);
 }
});

const upload = multer({ storage: storage });


// ===== APPLY JOB + SKILL MATCH =====
router.post('/:jobId', protect, authorize('jobseeker'), upload.single("resume"), async (req, res) => {

 try {

  const job = await Job.findById(req.params.jobId);
  const user = req.user;

  if (!job)
   return res.status(404).json({ success: false, message: 'Job not found' });

  const already = await Application.findOne({
   job: req.params.jobId,
   applicant: req.user._id
  });

  if (already)
   return res.status(400).json({ success: false, message: 'Already applied' });

  // ===== SKILL MATCHING =====

  const jobSkills = job.skills || [];
  const userSkills = user.skills || [];

  const matchedSkills = jobSkills.filter(skill =>
   userSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
  );

  let status = "rejected";

  if (matchedSkills.length > 0) {
   status = "shortlisted";
  }

  const resume = req.file ? req.file.filename : "";

  const app = await Application.create({
   job: req.params.jobId,
   applicant: req.user._id,
   coverLetter: req.body.coverLetter || '',
   resume: resume,
   matchedSkills: matchedSkills,
   status: status
  });

  await app.populate('job', 'title company');

  res.status(201).json({
   success: true,
   matchedSkills,
   status,
   application: app
  });

 } catch (err) {

  res.status(500).json({
   success: false,
   message: err.message
  });

 }

});


// ===== JOB SEEKER APPLICATIONS =====
router.get('/my', protect, authorize('jobseeker'), async (req, res) => {

 try {

  const apps = await Application.find({ applicant: req.user._id })
   .populate('job', 'title company location jobType salary status')
   .sort({ appliedAt: -1 });

  res.json({
   success: true,
   count: apps.length,
   applications: apps
  });

 } catch (err) {

  res.status(500).json({
   success: false,
   message: err.message
  });

 }

});


// ===== HR VIEW APPLICANTS =====
router.get('/job/:jobId', protect, authorize('hr', 'admin'), async (req, res) => {

 try {

  const apps = await Application.find({ job: req.params.jobId })
   .populate('applicant', 'name email phone skills experience education')
   .sort({ appliedAt: -1 });

  res.json({
   success: true,
   count: apps.length,
   applications: apps
  });

 } catch (err) {

  res.status(500).json({
   success: false,
   message: err.message
  });

 }

});


// ===== UPDATE STATUS =====
router.put('/:id/status', protect, authorize('hr', 'admin'), async (req, res) => {

 try {

  const { status, interviewDate, interviewTime, interviewMode, interviewLink, hrNote } = req.body;

  const app = await Application.findByIdAndUpdate(
   req.params.id,
   { status, interviewDate, interviewTime, interviewMode, interviewLink, hrNote },
   { new: true }
  )
   .populate('applicant', 'name email')
   .populate('job', 'title company');

  if (!app)
   return res.status(404).json({ success: false, message: 'Application not found' });

  res.json({
   success: true,
   application: app
  });

 } catch (err) {

  res.status(500).json({
   success: false,
   message: err.message
  });

 }

});


// ===== ADMIN VIEW ALL =====
router.get('/all', protect, authorize('admin'), async (req, res) => {

 try {

  const apps = await Application.find()
   .populate('applicant', 'name email')
   .populate('job', 'title company')
   .sort({ appliedAt: -1 });

  res.json({
   success: true,
   count: apps.length,
   applications: apps
  });

 } catch (err) {

  res.status(500).json({
   success: false,
   message: err.message
  });

 }

});

module.exports = router;