const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Job = require("../models/Job");

router.get("/skill-match/:jobId", async (req, res) => {

  try {

    const job = await Job.findById(req.params.jobId);

    const applications = await Application.find({ job: req.params.jobId })
      .populate("applicant");

    const result = applications.map(app => {

      const jobSkills = job.skills || [];
      const candidateSkills = app.applicant.skills || [];

      const matchedSkills = jobSkills.filter(skill =>
        candidateSkills.includes(skill)
      );

      const matchPercentage =
        jobSkills.length > 0
          ? Math.round((matchedSkills.length / jobSkills.length) * 100)
          : 0;

      return {
        candidate: app.applicant.name,
        email: app.applicant.email,
        skills: candidateSkills,
        match: matchPercentage
      };

    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

module.exports = router;