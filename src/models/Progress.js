const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true },
  studentId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId:    { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId:    { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
s.index({ studentId: 1, courseId: 1 });
s.index({ studentId: 1, lessonId: 1 }, { unique: true });
module.exports = model('Progress', s);
