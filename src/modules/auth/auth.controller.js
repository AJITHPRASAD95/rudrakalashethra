const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const School = require('../../models/School');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const signRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, branchId, schoolSlug } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'name, email, password required');
  let school = await School.findOne({ slug: schoolSlug || 'default' });
  if (!school) school = await School.create({ name: 'My Dance School', slug: schoolSlug || 'default' });
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({
    schoolId: school._id, branchId: branchId || null,
    name, email, phone, password, role: role || 'student',
  });
  const token = signToken(user._id);
  const refresh = signRefresh(user._id);
  res.status(201).json(ApiResponse.success({ token, refreshToken: refresh,
    user: { _id: user._id, name, email, role: user.role, branchId: user.branchId, schoolId: user.schoolId }
  }, 'Registered successfully'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password required');
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account deactivated');
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  const refresh = signRefresh(user._id);
  res.json(ApiResponse.success({
    token, refreshToken: refresh,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role,
            branchId: user.branchId, schoolId: user.schoolId, avatar: user.avatar }
  }, 'Login successful'));
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: rt } = req.body;
  if (!rt) throw new ApiError(400, 'Refresh token required');
  let decoded;
  try { decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET); }
  catch(e) { throw new ApiError(401, 'Invalid refresh token'); }
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User not found');
  res.json(ApiResponse.success({ token: signToken(user._id) }, 'Token refreshed'));
});

const getMe = asyncHandler(async (req, res) => res.json(ApiResponse.success(req.user)));

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { fcmToken: null });
  res.json(ApiResponse.success(null, 'Logged out'));
});

module.exports = { register, login, refreshToken, getMe, logout };
