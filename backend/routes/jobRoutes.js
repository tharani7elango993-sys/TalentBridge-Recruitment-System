const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const User = require("../models/User");


// SKILLS MATCHING API
router.get("/match/:jobId/:userId", async (req, res) => {

  try {

    const job = await Job.findById(req.params.jobId);
    const user = await User.findById(req.params.userId);

    const jobSkills = job.skills;
    const userSkills = user.skills;

    const matchedSkills = jobSkills.filter(skill =>
      userSkills.includes(skill)
    );

    const status = matchedSkills.length > 0 ? "Selected" : "Rejected";

    res.json({
      matchedSkills,
      status
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

module.exports = router;