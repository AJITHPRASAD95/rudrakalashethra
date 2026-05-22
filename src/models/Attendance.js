const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:  { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId:  { type: Schema.Types.ObjectId, ref: 'Branch' },
  classId:   { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['present','absent','late','joined'], default: 'absent' },
  joinedAt:  Date,
  leftAt:    Date,
  markedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ classId: 1, studentId: 1 }, { unique: true });
module.exports = model('Attendance', s);
