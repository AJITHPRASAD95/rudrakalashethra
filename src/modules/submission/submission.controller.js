const Submission = require('../../models/Submission');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { sendPush } = require('../../utils/notify');

const getSubmissions = asyncHandler(async (req, res) => {
  const { lessonId, studentId, page=1, limit=20 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.studentId = req.user._id;
  else if (studentId) filter.studentId = studentId;
  if (lessonId) filter.lessonId = lessonId;
  const total = await Submission.countDocuments(filter);
  const subs = await Submission.find(filter).populate('studentId','name email avatar').populate('lessonId','title').skip((page-1)*limit).limit(+limit).sort('-updatedAt');
  res.json(ApiResponse.paginated(subs, total, page, limit));
});

const createSubmission = asyncHandler(async (req, res) => {
  const { lessonId, notes } = req.body;
  if (!req.file) throw new ApiError(400, 'Video file required');
  const videoUrl = req.file.location || '/uploads/' + req.file.filename;
  let sub = await Submission.findOne({ studentId: req.user._id, lessonId });
  if (sub) {
    sub.versions.push({ videoUrl, notes, uploadedAt: new Date() });
    sub.latestVersion = sub.versions.length - 1;
    await sub.save();
  } else {
    sub = await Submission.create({ schoolId: req.user.schoolId, branchId: req.user.branchId, lessonId, studentId: req.user._id, versions: [{ videoUrl, notes }] });
  }
  res.status(201).json(ApiResponse.success(sub, 'Practice video uploaded'));
});

const getSubmission = asyncHandler(async (req, res) => {
  const sub = await Submission.findById(req.params.id).populate('studentId','name email').populate('versions.feedback.teacherId','name');
  if (!sub) throw new ApiError(404, 'Submission not found');
  res.json(ApiResponse.success(sub));
});

const addFeedback = asyncHandler(async (req, res) => {
  const { comment, rating, versionIndex } = req.body;
  const sub = await Submission.findById(req.params.id).populate('studentId','fcmToken name');
  if (!sub) throw new ApiError(404, 'Submission not found');
  const idx = versionIndex !== undefined ? versionIndex : sub.latestVersion;
  sub.versions[idx].feedback.push({ teacherId: req.user._id, comment, rating, timestamp: new Date() });
  await sub.save();
  if (sub.studentId && sub.studentId.fcmToken) {
    sendPush([sub.studentId.fcmToken], { title: 'New feedback on your practice', body: req.user.name + ': ' + comment, data: { submissionId: sub._id.toString() } });
  }
  res.json(ApiResponse.success(sub, 'Feedback added'));
});

module.exports = { getSubmissions, createSubmission, getSubmission, addFeedback };
