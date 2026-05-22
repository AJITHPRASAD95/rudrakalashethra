const { Schema, model } = require('mongoose');
const s = new Schema({
  schoolId:          { type: Schema.Types.ObjectId, ref: 'School', required: true },
  branchId:          { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  studentId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  feeStructureId:    { type: Schema.Types.ObjectId, ref: 'FeeStructure' },
  amount:            { type: Number, required: true },
  currency:          { type: String, default: 'INR' },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status:            { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  dueDate:           Date,
  paidAt:            Date,
  description:       String,
  month:             String,
  source:            { type: String, enum: ['manual','online','attendance_auto','fee_apply'], default: 'manual' },
  classCount:        Number,
  attendanceFrom:    Number,
  attendanceTo:      Number,
}, { timestamps: true });
s.index({ branchId: 1, status: 1 });
s.index({ studentId: 1, status: 1 });
s.index({ studentId: 1, feeStructureId: 1, source: 1 });
module.exports = model('Payment', s);
