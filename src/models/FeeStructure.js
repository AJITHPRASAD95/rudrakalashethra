const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  branchId:    { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  name:        { type: String, required: true },       // e.g. "Basic Pack"
  classCount:  { type: Number, required: true },       // e.g. 4
  amount:      { type: Number, required: true },       // e.g. 400
  currency:    { type: String, default: 'INR' },
  description: String,
  isActive:    { type: Boolean, default: true },
  color:       { type: String, default: '#c9a96e' },   // UI accent color
}, { timestamps: true });
s.index({ schoolId: 1, branchId: 1, isActive: 1 });
module.exports = model('FeeStructure', s);
