const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  coverLetter: {
    type: String,
    default: ""
  },

  // ⭐ Resume upload field
  resume: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: [
      "applied",
      "shortlisted",
      "interview_scheduled",
      "selected",
      "rejected"
    ],
    default: "applied"
  },
  matchedSkills: {
 type: [String],
 default: []
},

  interviewDate: {
    type: String,
    default: ""
  },

  interviewTime: {
    type: String,
    default: ""
  },

  interviewMode: {
    type: String,
    enum: ["online", "offline", "phone"],
    default: "online"
  },

  interviewLink: {
    type: String,
    default: ""
  },

  hrNote: {
    type: String,
    default: ""
  },

  appliedAt: {
    type: Date,
    default: Date.now
  }

});


// Prevent duplicate applications
applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);