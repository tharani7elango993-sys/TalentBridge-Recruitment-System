const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['jobseeker', 'hr', 'admin'], default: 'jobseeker' },
  phone:      { type: String, default: '' },
  // Job Seeker fields
  skills:     [{ type: String }],
  experience: { type: String, default: '' },
  education:  { type: String, default: '' },
  // HR fields
  department: { type: String, default: '' },
  company:    { type: String, default: 'TalentBridge Corp' },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
