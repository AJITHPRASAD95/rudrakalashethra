const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  branchId:    { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  title:       { type: String, required: true },
  description: String,
  coverImage:  String,
  level:       { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  assignedTo:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });
s.index({ schoolId: 1, branchId: 1, isPublished: 1 });
module.exports = model('Course', s);
