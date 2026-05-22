const { Schema, model } = require('mongoose');
const s = new Schema({
  name:     { type: String, required: true },
  slug:     { type: String, required: true, unique: true, lowercase: true },
  logo:     String,
  address:  String,
  phone:    String,
  email:    String,
  isActive: { type: Boolean, default: true },
  settings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
module.exports = model('School', s);
