const Branch = require('../../models/Branch');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getBranches = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role !== 'super_admin') filter._id = req.user.branchId;
  const branches = await Branch.find(filter).populate('managerId', 'name email');
  res.json(ApiResponse.success(branches));
});
const createBranch = asyncHandler(async (req, res) => {
  const { name, address, phone, managerId, timezone } = req.body;
  if (!name) throw new ApiError(400, 'Branch name required');
  const branch = await Branch.create({ schoolId: req.user.schoolId, name, address, phone, managerId, timezone });
  res.status(201).json(ApiResponse.success(branch, 'Branch created'));
});
const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id).populate('managerId','name email');
  if (!branch) throw new ApiError(404, 'Branch not found');
  res.json(ApiResponse.success(branch));
});
const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!branch) throw new ApiError(404, 'Branch not found');
  res.json(ApiResponse.success(branch, 'Branch updated'));
});
const deleteBranch = asyncHandler(async (req, res) => {
  await Branch.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json(ApiResponse.success(null, 'Branch deactivated'));
});
module.exports = { getBranches, createBranch, getBranch, updateBranch, deleteBranch };
