const { Schema, model } = require('mongoose');

const questionSchema = new Schema({
  prompt:       { type: String, required: true },
  options:      { type: [String], validate: v => v.length >= 2 },
  correctIndex: { type: Number, required: true },
  explanation:  String,
}, { _id: false });

/**
 * Quiz — practice exercises. Embedded questions for simplicity.
 *   category   : free-form (e.g. "Mudras", "Theory", "Adavus")
 *   passingScore: % needed to pass (default 60)
 */
const s = new Schema({
  schoolId:     { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  title:        { type: String, required: true, trim: true },
  description:  String,
  category:     { type: String, default: 'General', index: true },
  questions:    { type: [questionSchema], validate: v => v.length >= 1 },
  passingScore: { type: Number, default: 60 },
  isPublished:  { type: Boolean, default: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

s.index({ schoolId: 1, category: 1, isPublished: 1 });
s.virtual('questionCount').get(function(){ return this.questions ? this.questions.length : 0; });
s.set('toJSON', { virtuals: true });

module.exports = model('Quiz', s);
