const Class = require('../../models/Class');
const Attendance = require('../../models/Attendance');
const Branch = require('../../models/Branch');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendPush } = require('../../utils/notify');

const getClasses = asyncHandler(async (req, res) => {
  const { branchId, date, status, page=1, limit=20 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.studentIds = req.user._id;
  else if (req.user.role === 'teacher') filter.teacherId = req.user._id;
  else if (req.user.branchId && req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  if (branchId && req.user.role === 'super_admin') filter.branchId = branchId;
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end   = new Date(date); end.setHours(23,59,59,999);
    filter.scheduledAt = { $gte: start, $lte: end };
  }
  const total = await Class.countDocuments(filter);
  const classes = await Class.find(filter)
    .populate('branchId','name')
    .populate('teacherId','name email').populate('studentIds','name email')
    .skip((page-1)*limit).limit(+limit).sort('scheduledAt');
  res.json(ApiResponse.paginated(classes, total, page, limit));
});

const createClass = asyncHandler(async (req, res) => {
  const { title, type, teacherId, studentIds, meetLink, scheduledAt, durationMins, branchId, notes } = req.body;
  if (!title||!type||!scheduledAt) throw new ApiError(400, 'title, type, scheduledAt required');
  let resolvedBranchId = branchId || req.user.branchId;
  if (!resolvedBranchId && req.user.role === 'super_admin') {
    const firstBranch = await Branch.findOne({ schoolId: req.user.schoolId, isActive: { $ne: false } }).select('_id');
    resolvedBranchId = firstBranch && firstBranch._id;
  }
  if (!resolvedBranchId) throw new ApiError(400, 'branchId required. Select a branch for this class.');
  const enrolledStudentIds = studentIds && studentIds.length
    ? studentIds
    : (await User.find({
        schoolId: req.user.schoolId,
        branchId: resolvedBranchId,
        role: 'student',
        isActive: true,
      }).select('_id')).map(s => s._id);
  const cls = await Class.create({
    schoolId: req.user.schoolId, branchId: resolvedBranchId,
    title, type, teacherId, studentIds: enrolledStudentIds, meetLink,
    scheduledAt: new Date(scheduledAt), durationMins: durationMins||60, notes, createdBy: req.user._id,
  });
  if (enrolledStudentIds.length) {
    const records = enrolledStudentIds.map(sid => ({
      schoolId: req.user.schoolId, branchId: resolvedBranchId,
      classId: cls._id, studentId: sid, status: 'absent',
    }));
    await Attendance.insertMany(records, { ordered: false }).catch(()=>{});
    const students = await User.find({ _id: { $in: enrolledStudentIds } }).select('fcmToken');
    const tokens = students.map(s => s.fcmToken).filter(Boolean);
    sendPush(tokens, { title: 'New class: ' + title, body: 'Scheduled: ' + new Date(scheduledAt).toLocaleString('en-IN'), data: { classId: cls._id.toString() } });
  }
  res.status(201).json(ApiResponse.success(cls, 'Class created'));
});

const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id).populate('teacherId','name email avatar').populate('studentIds','name email avatar').populate('createdBy','name');
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json(ApiResponse.success(cls));
});

const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json(ApiResponse.success(cls, 'Updated'));
});

const deleteClass = asyncHandler(async (req, res) => {
  await Class.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  res.json(ApiResponse.success(null, 'Class cancelled'));
});

const joinClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new ApiError(404, 'Class not found');
  const uid = req.user._id.toString();
  const isTeacher = cls.teacherId && cls.teacherId.toString() === uid;
  const isStudent = cls.studentIds.map(String).includes(uid);
  const isAdmin   = ['super_admin','branch_manager'].includes(req.user.role);
  if (!isTeacher && !isStudent && !isAdmin) throw new ApiError(403, 'Not enrolled in this class');
  if (isStudent) {
    await Attendance.findOneAndUpdate(
      { classId: cls._id, studentId: req.user._id },
      { status: 'joined', joinedAt: new Date() },
      { upsert: true, new: true }
    );
  }
  res.json(ApiResponse.success({ meetLink: cls.meetLink, title: cls.title, scheduledAt: cls.scheduledAt }));
});

const updateStatus = asyncHandler(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!cls) throw new ApiError(404, 'Class not found');
  res.json(ApiResponse.success(cls, 'Status updated'));
});

module.exports = { getClasses, createClass, getClass, updateClass, deleteClass, joinClass, updateStatus };
