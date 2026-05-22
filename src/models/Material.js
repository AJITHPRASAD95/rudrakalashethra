const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:   { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId:   { type: Schema.Types.ObjectId, ref: 'Branch' },
  lessonId:   { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
  title:      String,
  type:       { type: String, enum: ['video','image','pdf','audio'], required: true },
  url:        { type: String, required: true },
  size:       Number,
  duration:   Number,
  order:      { type: Number, default: 0 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = model('Material', s);
