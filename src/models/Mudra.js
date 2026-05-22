const { Schema, model } = require('mongoose');

/**
 * Mudra — a hand gesture entry with rich teaching content.
 *   schoolId  : tenant
 *   category  : Asamyukta (single-hand) | Samyukta (double-hand) | Other
 *   image     : reference photo / diagram (url)
 *   videoUrl  : optional demo video (uploaded path or YouTube/Vimeo embed url)
 *   videoSource: 'upload' | 'youtube' | 'vimeo' | 'none'
 *   meaning   : short meaning / translation
 *   description: longer description / how to form it (rich text / markdown)
 *   usage     : how it is used in dance / examples
 *   tags      : free-form tags
 *   order     : display order within category
 */
const s = new Schema({
  schoolId:     { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name:         { type: String, required: true, trim: true },
  sanskritName: { type: String, trim: true },
  category:     { type: String, enum: ['Asamyukta','Samyukta','Other'], default: 'Asamyukta', index: true },
  image:        String,
  videoUrl:     String,
  videoSource:  { type: String, enum: ['upload','youtube','vimeo','none'], default: 'none' },
  meaning:      String,
  description:  String,
  usage:        String,
  tags:         [String],
  order:        { type: Number, default: 0 },
  isPublished:  { type: Boolean, default: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

s.index({ schoolId: 1, category: 1, isPublished: 1 });
s.index({ name: 'text', meaning: 'text', description: 'text', tags: 'text' });

module.exports = model('Mudra', s);
