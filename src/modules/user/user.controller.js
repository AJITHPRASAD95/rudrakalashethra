const User = require('../../models/User');
const Class = require('../../models/Class');
const Payment = require('../../models/Payment');
const Attendance = require('../../models/Attendance');
const LearnProgress = require('../../models/LearnProgress');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getUsers = asyncHandler(async (req, res) => {
  const { role, branchId, page=1, limit=20, search, isActive } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'branch_manager') filter.branchId = req.user.branchId;
  else if (branchId) filter.branchId = branchId;
  if (role) filter.role = role;
  if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';
  if (search) {
    const rx = { $regex: search, $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const total = await User.countDocuments(filter);
  const users = await User.find(filter).select('-password')
    .populate('branchId','name').populate('parentOf','name email')
    .skip((page-1)*limit).limit(+limit).sort('-createdAt');
  res.json(ApiResponse.paginated(users, total, page, limit));
});
const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, branchId } = req.body;
  if (!name||!email||!password||!role) throw new ApiError(400, 'name, email, password, role required');
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({
    schoolId: req.user.schoolId, branchId: branchId || req.user.branchId,
    name, email, phone, password, role,
  });
  res.status(201).json(ApiResponse.success({ _id: user._id, name, email, role }, 'User created'));
});
const getUser = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'branch_manager') filter.branchId = req.user.branchId;
  const user = await User.findOne(filter).select('-password')
    .populate('branchId','name').populate('parentOf','name email');
  if (!user) throw new ApiError(404, 'User not found');
  res.json(ApiResponse.success(user));
});
const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name','email','phone','avatar','branchId','isActive'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'branch_manager') delete updates.branchId;
  if (req.user.role === 'branch_manager') filter.branchId = req.user.branchId;
  if (updates.email) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
    if (existing) throw new ApiError(409, 'Email already registered');
  }
  const user = await User.findOneAndUpdate(filter, updates, { new: true, runValidators: true }).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  res.json(ApiResponse.success(user, 'Updated'));
});
const deleteUser = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'branch_manager') filter.branchId = req.user.branchId;
  await User.findOneAndUpdate(filter, { isActive: false });
  res.json(ApiResponse.success(null, 'User deactivated'));
});
const linkParent = asyncHandler(async (req, res) => {
  const { parentId } = req.body;
  const scope = { schoolId: req.user.schoolId };
  if (req.user.role === 'branch_manager') scope.branchId = req.user.branchId;
  const [student, parent] = await Promise.all([
    User.findOne({ _id: req.params.id, role: 'student', ...scope }),
    User.findOne({ _id: parentId, role: 'parent', schoolId: req.user.schoolId }),
  ]);
  if (!student) throw new ApiError(404, 'Student not found');
  if (!parent || parent.role !== 'parent') throw new ApiError(400, 'Valid parent user required');
  if (!parent.parentOf.map(String).includes(student._id.toString())) {
    parent.parentOf.push(student._id);
    await parent.save();
  }
  res.json(ApiResponse.success(null, 'Parent linked'));
});
const getStudentProfile = asyncHandler(async (req, res) => {
  const scope = { _id: req.params.id, schoolId: req.user.schoolId, role: 'student' };
  if (req.user.role === 'branch_manager') scope.branchId = req.user.branchId;
  const student = await User.findOne(scope).select('-password').populate('branchId','name').lean();
  if (!student) throw new ApiError(404, 'Student not found');

  const [parents, classes, payments, attendance, progress] = await Promise.all([
    User.find({ schoolId: req.user.schoolId, role: 'parent', parentOf: student._id }).select('name email phone isActive').lean(),
    Class.find({ schoolId: req.user.schoolId, studentIds: student._id })
      .populate('teacherId','name email').sort('-scheduledAt').limit(8).lean(),
    Payment.find({ schoolId: req.user.schoolId, studentId: student._id }).sort('-createdAt').limit(8).lean(),
    Attendance.find({ schoolId: req.user.schoolId, studentId: student._id }).sort('-createdAt').limit(20).lean(),
    LearnProgress.find({ schoolId: req.user.schoolId, studentId: student._id }).sort('-lastAt').limit(12).lean(),
  ]);

  const now = new Date();
  const totals = {
    upcomingClasses: classes.filter(c => new Date(c.scheduledAt) >= now && c.status !== 'cancelled').length,
    completedClasses: classes.filter(c => c.status === 'completed').length,
    paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
    attendanceMarked: attendance.length,
    attendancePresent: attendance.filter(a => ['present','joined'].includes(a.status)).length,
    progressCompleted: progress.filter(p => p.status === 'completed').length,
    progressItems: progress.length,
  };

  res.json(ApiResponse.success({ student, parents, classes, payments, attendance, progress, totals }));
});
const updateFcmToken = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
  res.json(ApiResponse.success(null, 'FCM token updated'));
});
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image required');
  const url = req.file.location || '/uploads/' + req.file.filename;
  const user = await User.findByIdAndUpdate(req.params.id, { avatar: url }, { new: true }).select('-password');
  res.json(ApiResponse.success(user, 'Avatar updated'));
});
module.exports = { getUsers, createUser, getUser, updateUser, deleteUser, linkParent, getStudentProfile, updateFcmToken, updateAvatar };
