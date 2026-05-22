const FeeStructure = require('../../models/FeeStructure');
const Payment      = require('../../models/Payment');
const User         = require('../../models/User');
const ApiError     = require('../../utils/ApiError');
const ApiResponse  = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getFeeStructures = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.user.schoolId };
  if (req.user.branchId && req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  else if (req.query.branchId) filter.branchId = req.query.branchId;
  const fees = await FeeStructure.find(filter).sort('amount');
  res.json(ApiResponse.success(fees));
});

const createFeeStructure = asyncHandler(async (req, res) => {
  const { name, classCount, amount, description, color, branchId } = req.body;
  if (!name || !classCount || !amount) throw new ApiError(400, 'name, classCount, amount required');
  const fee = await FeeStructure.create({
    schoolId: req.user.schoolId,
    branchId: branchId || req.user.branchId,
    name, classCount, amount, description, color,
  });
  res.status(201).json(ApiResponse.success(fee, 'Fee structure created'));
});

const updateFeeStructure = asyncHandler(async (req, res) => {
  const fee = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!fee) throw new ApiError(404, 'Fee structure not found');
  res.json(ApiResponse.success(fee, 'Updated'));
});

const deleteFeeStructure = asyncHandler(async (req, res) => {
  await FeeStructure.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json(ApiResponse.success(null, 'Fee structure deactivated'));
});

// Create a payment record for a student using this fee structure
const applyFeeToStudent = asyncHandler(async (req, res) => {
  const { studentId, month, dueDate } = req.body;
  const fee = await FeeStructure.findById(req.params.id);
  if (!fee) throw new ApiError(404, 'Fee structure not found');
  const student = await User.findById(studentId);
  if (!student) throw new ApiError(404, 'Student not found');
  const payment = await Payment.create({
    schoolId:    req.user.schoolId,
    branchId:    fee.branchId || req.user.branchId,
    studentId,
    feeStructureId: fee._id,
    amount:      fee.amount,
    description: fee.name + ' — ' + fee.classCount + ' classes',
    month:       month || new Date().toISOString().slice(0,7),
    dueDate:     dueDate ? new Date(dueDate) : undefined,
    status:      'pending',
    source:      'fee_apply',
    classCount:  fee.classCount,
  });
  res.status(201).json(ApiResponse.success({ payment, fee }, 'Payment record created'));
});

module.exports = { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, applyFeeToStudent };
