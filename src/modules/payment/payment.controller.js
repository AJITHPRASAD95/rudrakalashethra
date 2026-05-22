const crypto = require('crypto');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendPush, sendWhatsApp } = require('../../utils/notify');

let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  }
} catch(e) { console.warn('[payment] Razorpay not configured'); }

const getPayments = asyncHandler(async (req, res) => {
  const { branchId, studentId, status, page=1, limit=20 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.studentId = req.user._id;
  else {
    if (req.user.branchId && req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
    if (branchId) filter.branchId = branchId;
    if (studentId) filter.studentId = studentId;
  }
  if (status) filter.status = status;
  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter).populate('studentId','name email phone').skip((page-1)*limit).limit(+limit).sort('-createdAt');
  res.json(ApiResponse.paginated(payments, total, page, limit));
});

const createOrder = asyncHandler(async (req, res) => {
  const { studentId, amount, description, dueDate, month, branchId } = req.body;
  if (!amount) throw new ApiError(400, 'Amount required');
  if (!razorpay) throw new ApiError(503, 'Payment gateway not configured. Set RAZORPAY_KEY_ID in .env');
  const order = await razorpay.orders.create({ amount: amount * 100, currency: 'INR', receipt: 'rcpt_' + Date.now() });
  const payment = await Payment.create({
    schoolId: req.user.schoolId, branchId: branchId||req.user.branchId,
    studentId: studentId||req.user._id, amount, description, dueDate, month,
    razorpayOrderId: order.id, status: 'pending',
  });
  res.status(201).json(ApiResponse.success({ orderId: order.id, paymentId: payment._id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID }, 'Order created'));
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET||'').update(body).digest('hex');
  if (expected !== razorpaySignature) throw new ApiError(400, 'Invalid payment signature');
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId }, { razorpayPaymentId, razorpaySignature, status: 'paid', paidAt: new Date() }, { new: true }
  ).populate('studentId','name email fcmToken phone');
  if (!payment) throw new ApiError(404, 'Payment record not found');
  if (payment.studentId && payment.studentId.fcmToken) {
    sendPush([payment.studentId.fcmToken], { title: 'Payment confirmed', body: 'INR ' + payment.amount + ' received. Thank you!', data: { paymentId: payment._id.toString() } });
  }
  if (payment.studentId && payment.studentId.phone) {
    sendWhatsApp(payment.studentId.phone, 'Payment of INR ' + payment.amount + ' confirmed for ' + (payment.description||'fees') + '. Thank you!');
  }
  res.json(ApiResponse.success(payment, 'Payment verified'));
});

const manualPayment = asyncHandler(async (req, res) => {
  const { studentId, amount, description, month, branchId, status='paid' } = req.body;
  const isPaid = status === 'paid';
  const payment = await Payment.create({
    schoolId: req.user.schoolId,
    branchId: branchId||req.user.branchId,
    studentId,
    amount,
    description,
    month,
    status: isPaid ? 'paid' : 'pending',
    source: 'manual',
    paidAt: isPaid ? new Date() : undefined,
  });
  res.status(201).json(ApiResponse.success(payment, 'Manual payment recorded'));
});

const getDues = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.user.schoolId, status: 'pending' };
  if (req.user.branchId && req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  if (req.query.branchId) filter.branchId = req.query.branchId;
  const dues = await Payment.find(filter).populate('studentId','name email phone').sort('dueDate');
  res.json(ApiResponse.success(dues));
});

const getPayment = asyncHandler(async (req, res) => {
  const p = await Payment.findById(req.params.id).populate('studentId','name email phone');
  if (!p) throw new ApiError(404, 'Payment not found');
  res.json(ApiResponse.success(p));
});

const markPaid = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.branchId && req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  const payment = await Payment.findOneAndUpdate(
    filter,
    { status: 'paid', paidAt: new Date() },
    { new: true }
  ).populate('studentId','name email phone');
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json(ApiResponse.success(payment, 'Payment marked paid'));
});

module.exports = { getPayments, createOrder, verifyPayment, manualPayment, getDues, getPayment, markPaid };
