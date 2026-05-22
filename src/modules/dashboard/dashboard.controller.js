const User = require('../../models/User');
const Class = require('../../models/Class');
const Payment = require('../../models/Payment');
const Attendance = require('../../models/Attendance');
const Course = require('../../models/Course');
const Submission = require('../../models/Submission');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getOverview = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  else if (branchId) filter.branchId = branchId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents, totalTeachers, totalCourses,
    upcomingClasses, pendingPayments, recentSubmissions,
    monthlyRevenue, activeClasses
  ] = await Promise.all([
    User.countDocuments({ ...filter, role: 'student', isActive: true }),
    User.countDocuments({ ...filter, role: 'teacher', isActive: true }),
    Course.countDocuments({ ...filter, isPublished: true }),
    Class.countDocuments({ ...filter, status: 'scheduled', scheduledAt: { $gte: now } }),
    Payment.countDocuments({ ...filter, status: 'pending' }),
    Submission.countDocuments({ ...filter, createdAt: { $gte: monthStart } }),
    Payment.aggregate([
      { $match: { ...filter, status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Class.countDocuments({ ...filter, status: 'live' }),
  ]);

  res.json(ApiResponse.success({
    totalStudents, totalTeachers, totalCourses, upcomingClasses,
    pendingPayments, recentSubmissions, activeClasses,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
  }));
});

const getRevenue = asyncHandler(async (req, res) => {
  const { branchId, from, to } = req.query;
  const filter = { schoolId: req.user.schoolId, status: 'paid' };
  if (req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  else if (branchId) filter.branchId = branchId;
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = new Date(from);
    if (to)   filter.paidAt.$lte = new Date(to);
  }
  const revenue = await Payment.aggregate([
    { $match: filter },
    { $group: {
      _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
      total: { $sum: '$amount' }, count: { $sum: 1 },
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  res.json(ApiResponse.success(revenue));
});

const getAttendanceStats = asyncHandler(async (req, res) => {
  const { branchId, from, to } = req.query;
  const classFilter = { schoolId: req.user.schoolId };
  if (req.user.role !== 'super_admin') classFilter.branchId = req.user.branchId;
  else if (branchId) classFilter.branchId = branchId;
  if (from||to) { classFilter.scheduledAt={}; if(from) classFilter.scheduledAt.$gte=new Date(from); if(to) classFilter.scheduledAt.$lte=new Date(to); }
  const classes = await Class.find(classFilter).select('_id');
  const ids = classes.map(c => c._id);
  const stats = await Attendance.aggregate([
    { $match: { classId: { $in: ids } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  res.json(ApiResponse.success(stats));
});

module.exports = { getOverview, getRevenue, getAttendanceStats };
