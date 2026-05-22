const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title:    { type: String, required: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });
module.exports = model('Module', s);
