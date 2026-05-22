const Attendance = require('../../models/Attendance');
const Class      = require('../../models/Class');
const FeeStructure = require('../../models/FeeStructure');
const Payment    = require('../../models/Payment');
const User       = require('../../models/User');
const ApiError   = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const PAYABLE_STATUSES = ['present', 'late', 'joined'];

const getActiveFeeForBranch = async (schoolId, branchId) => {
  const branchFee = await FeeStructure.findOne({ schoolId, branchId, isActive: true }).sort('classCount amount');
  if (branchFee) return branchFee;
  return FeeStructure.findOne({
    schoolId,
    isActive: true,
    $or: [{ branchId: null }, { branchId: { $exists: false } }],
  }).sort('classCount amount');
};

const createAttendanceFees = async ({ schoolId, branchId, studentIds }) => {
  const fee = await getActiveFeeForBranch(schoolId, branchId);
  if (!fee || !fee.classCount || !fee.amount) return [];

  const created = [];
  for (const studentId of [...new Set(studentIds.map(String))]) {
    const attendedCount = await Attendance.countDocuments({
      schoolId,
      branchId,
      studentId,
      status: { $in: PAYABLE_STATUSES },
    });
    const payableBlocks = Math.floor(attendedCount / fee.classCount);
    if (payableBlocks <= 0) continue;

    const existingBlocks = await Payment.countDocuments({
      schoolId,
      branchId,
      studentId,
      feeStructureId: fee._id,
      source: 'attendance_auto',
    });

    for (let block = existingBlocks + 1; block <= payableBlocks; block++) {
      const from = ((block - 1) * fee.classCount) + 1;
      const to = block * fee.classCount;
      const payment = await Payment.create({
        schoolId,
        branchId,
        studentId,
        feeStructureId: fee._id,
        amount: fee.amount,
        currency: fee.currency || 'INR',
        status: 'pending',
        source: 'attendance_auto',
        classCount: fee.classCount,
        attendanceFrom: from,
        attendanceTo: to,
        month: new Date().toISOString().slice(0, 7),
        dueDate: new Date(),
        description: fee.name + ' - ' + fee.classCount + ' attended classes (' + from + '-' + to + ')',
      });
      created.push(payment);
    }
  }
  return created;
};

// Get all attendance records (filterable)
const getAttendance = asyncHandler(async (req, res) => {
  const { classId, studentId, page=1, limit=50 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (classId)   filter.classId   = classId;
  if (studentId) filter.studentId = studentId;
  if (req.user.role === 'student') filter.studentId = req.user._id;
  const total = await Attendance.countDocuments(filter);
  const records = await Attendance.find(filter)
    .populate('studentId','name email avatar')
    .populate('classId','title scheduledAt')
    .skip((page-1)*limit).limit(+limit).sort('-createdAt');
  res.json(ApiResponse.paginated(records, total, page, limit));
});

// Get a class with all its enrolled students + their current attendance status
// This powers the attendance marking UI
const getClassRoster = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.classId)
    .populate('studentIds','name email avatar phone')
    .populate('teacherId','name');
  if (!cls) throw new ApiError(404, 'Class not found');

  // Get existing attendance records for this class
  const existing = await Attendance.find({ classId: cls._id });
  const attMap = {};
  existing.forEach(a => { attMap[a.studentId.toString()] = a.status; });

  // Merge student list with their status
  const roster = (cls.studentIds || []).map(s => ({
    _id:    s._id,
    name:   s.name,
    email:  s.email,
    avatar: s.avatar,
    phone:  s.phone,
    status: attMap[s._id.toString()] || 'absent',
  }));

  res.json(ApiResponse.success({ class: cls, roster }));
});

// Mark single student
const markAttendance = asyncHandler(async (req, res) => {
  const { classId, studentId, status } = req.body;
  if (!classId || !studentId || !status) throw new ApiError(400, 'classId, studentId, status required');
  const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
  if (!cls) throw new ApiError(404, 'Class not found');
  const record = await Attendance.findOneAndUpdate(
    { classId, studentId },
    { $set: { status, markedBy: req.user._id, schoolId: req.user.schoolId, branchId: cls.branchId } },
    { upsert: true, new: true }
  ).populate('studentId','name');
  const payments = PAYABLE_STATUSES.includes(status)
    ? await createAttendanceFees({ schoolId: req.user.schoolId, branchId: cls.branchId, studentIds: [studentId] })
    : [];
  res.json(ApiResponse.success({ record, payments }, payments.length ? 'Attendance marked and pending fee created' : 'Attendance marked'));
});

// Bulk mark all students for a class at once
const bulkMark = asyncHandler(async (req, res) => {
  const { classId, records } = req.body;
  if (!classId || !records?.length) throw new ApiError(400, 'classId and records required');
  const cls = await Class.findOne({ _id: classId, schoolId: req.user.schoolId });
  if (!cls) throw new ApiError(404, 'Class not found');
  const ops = records.map(r => ({
    updateOne: {
      filter: { classId, studentId: r.studentId },
      update: { $set: { status: r.status, markedBy: req.user._id, schoolId: req.user.schoolId, branchId: cls.branchId } },
      upsert: true,
    }
  }));
  await Attendance.bulkWrite(ops);
  // Update class status to completed
  await Class.findByIdAndUpdate(classId, { status: 'completed' });
  const payableStudents = records.filter(r => PAYABLE_STATUSES.includes(r.status)).map(r => r.studentId);
  const payments = await createAttendanceFees({ schoolId: req.user.schoolId, branchId: cls.branchId, studentIds: payableStudents });
  res.json(ApiResponse.success({ payments }, payments.length ? 'Attendance saved and pending fees created' : 'Attendance saved for all students'));
});

// Student-wise attendance summary
const studentSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { from, to } = req.query;
  const filter = { schoolId: req.user.schoolId, studentId };
  if (from || to) {
    const classes = await Class.find({
      schoolId: req.user.schoolId,
      ...(from || to ? { scheduledAt: { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) } } : {}),
    }).select('_id');
    filter.classId = { $in: classes.map(c => c._id) };
  }
  const records = await Attendance.find(filter).populate('classId','title scheduledAt status');
  const summary = { total: records.length, present: 0, absent: 0, late: 0 };
  records.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });
  summary.percentage = summary.total ? Math.round((summary.present + summary.late) / summary.total * 100) : 0;
  res.json(ApiResponse.success({ summary, records }));
});

const attendanceReport = asyncHandler(async (req, res) => {
  const { branchId, from, to } = req.query;
  const classFilter = { schoolId: req.user.schoolId };
  if (branchId) classFilter.branchId = branchId;
  if (from||to) { classFilter.scheduledAt={}; if(from) classFilter.scheduledAt.$gte=new Date(from); if(to) classFilter.scheduledAt.$lte=new Date(to); }
  const classes = await Class.find(classFilter).select('_id title scheduledAt');
  const classIds = classes.map(c => c._id);
  const report = await Attendance.aggregate([
    { $match: { classId: { $in: classIds } } },
    { $group: { _id: { classId: '$classId', status: '$status' }, count: { $sum: 1 } } },
    { $group: { _id: '$_id.classId', statuses: { $push: { status: '$_id.status', count: '$count' } } } },
  ]);
  res.json(ApiResponse.success({ classes, report }));
});

module.exports = { getAttendance, getClassRoster, markAttendance, bulkMark, studentSummary, attendanceReport };
