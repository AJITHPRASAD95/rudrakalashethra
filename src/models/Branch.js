const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:  { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name:      { type: String, required: true },
  address:   String,
  phone:     String,
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive:  { type: Boolean, default: true },
  timezone:  { type: String, default: 'Asia/Kolkata' },
}, { timestamps: true });
s.index({ schoolId: 1, isActive: 1 });
module.exports = model('Branch', s);
