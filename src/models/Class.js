const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:     { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId:     { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  title:        { type: String, required: true },
  type:         { type: String, enum: ['one_to_one','group'], required: true },
  teacherId:    { type: Schema.Types.ObjectId, ref: 'User' },
  studentIds:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  meetLink:     String,
  scheduledAt:  { type: Date, required: true, index: true },
  durationMins: { type: Number, default: 60 },
  status:       { type: String, enum: ['scheduled','live','completed','cancelled'], default: 'scheduled' },
  recordingUrl: String,
  notes:        String,
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ branchId: 1, scheduledAt: 1 });
s.index({ schoolId: 1, scheduledAt: 1 });
module.exports = model('Class', s);
