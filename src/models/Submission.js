const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:  { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId:  { type: Schema.Types.ObjectId, ref: 'Branch' },
  lessonId:  { type: Schema.Types.ObjectId, ref: 'Lesson', index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  versions: [{
    videoUrl:   String,
    notes:      String,
    uploadedAt: { type: Date, default: Date.now },
    feedback: [{
      teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
      comment:   String,
      rating:    { type: Number, min: 1, max: 5 },
      timestamp: { type: Date, default: Date.now },
    }],
  }],
  latestVersion: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = model('Submission', s);
