const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId:    { type: Schema.Types.ObjectId, ref: 'Branch' },
  moduleId:    { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
  title:       { type: String, required: true },
  description: String,
  order:       { type: Number, default: 0 },
  isLocked:    { type: Boolean, default: true },
  unlockAfter: { type: Schema.Types.ObjectId, ref: 'Lesson' },
}, { timestamps: true });
module.exports = model('Lesson', s);
