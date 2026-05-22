const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const s = new Schema({
  schoolId:  { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  branchId:  { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  password:  { type: String, required: true, select: false },
  role:      { type: String, enum: ['super_admin','branch_manager','teacher','student','parent'], required: true },
  parentOf:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  avatar:    String,
  fcmToken:  String,
  isActive:  { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });
s.index({ schoolId: 1, branchId: 1, role: 1 });
s.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
s.methods.comparePassword = function(plain) { return require('bcryptjs').compare(plain, this.password); };
module.exports = model('User', s);
