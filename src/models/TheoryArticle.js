const { Schema, model } = require('mongoose');

/**
 * TheoryArticle — rich-text theory lessons (history, terminology, principles).
 *   body is HTML produced by a WYSIWYG editor or markdown rendered client-side.
 */
const s = new Schema({
  schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  subtitle:    { type: String, trim: true },
  category:    { type: String, default: 'General', index: true },
  coverImage:  String,
  body:        { type: String, required: true },
  readMinutes: { type: Number, default: 0 },
  tags:        [String],
  order:       { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

s.index({ schoolId: 1, category: 1, isPublished: 1 });
s.index({ title: 'text', body: 'text', tags: 'text' });

module.exports = model('TheoryArticle', s);
