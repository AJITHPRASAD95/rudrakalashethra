const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  branchId:    { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  category:    { type: String, required: true },       // e.g. "Mudras", "Theory", "Footwork"
  title:       { type: String, required: true },
  description: String,
  type:        { type: String, enum: ['video','image','pdf','audio'], required: true },
  url:         { type: String, required: true },       // for embeds, the watchable URL (e.g. youtu.be/xxx)
  source:      { type: String, enum: ['upload','youtube','vimeo','external'], default: 'upload' },
  embedId:     String,                                  // youtube/vimeo id parsed from url
  thumbnail:   String,
  duration:    Number,                                 // seconds for video/audio
  size:        Number,
  tags:        [String],
  order:       { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  uploadedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ schoolId: 1, category: 1, isPublished: 1 });
module.exports = model('Content', s);
