const { Schema, model } = require('mongoose');

/**
 * LearnProgress — per-student progress on a single learnable item.
 *   itemType : 'mudra' | 'theory' | 'video' | 'quiz'
 *   itemId   : the ObjectId of that item
 *   status   : 'viewed' | 'practiced' | 'completed'
 *   score    : for quizzes, last percentage scored
 *   bestScore: best percentage achieved
 *   attempts : number of times attempted (esp. for quiz)
 */
const s = new Schema({
  schoolId:  { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemType:  { type: String, enum: ['mudra','theory','video','quiz'], required: true },
  itemId:    { type: Schema.Types.ObjectId, required: true },
  status:    { type: String, enum: ['viewed','practiced','completed'], default: 'viewed' },
  score:     Number,
  bestScore: Number,
  attempts:  { type: Number, default: 0 },
  lastAt:    { type: Date, default: Date.now },
}, { timestamps: true });

s.index({ studentId: 1, itemType: 1, itemId: 1 }, { unique: true });
s.index({ studentId: 1, itemType: 1 });

module.exports = model('LearnProgress', s);
