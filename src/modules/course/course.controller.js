const Course = require('../../models/Course');
const Module = require('../../models/Module');
const Lesson = require('../../models/Lesson');
const Material = require('../../models/Material');
const Progress = require('../../models/Progress');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getCourses = asyncHandler(async (req, res) => {
  const { branchId, level, page=1, limit=20 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.assignedTo = req.user._id;
  if (branchId) filter.branchId = branchId;
  else if (req.user.branchId && req.user.role !== 'super_admin') filter.branchId = req.user.branchId;
  if (level) filter.level = level;
  const total = await Course.countDocuments(filter);
  const courses = await Course.find(filter).populate('createdBy','name').skip((page-1)*limit).limit(+limit).sort('-createdAt');
  res.json(ApiResponse.paginated(courses, total, page, limit));
});
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, level, branchId } = req.body;
  if (!title) throw new ApiError(400, 'Title required');
  const coverImage = req.file ? (req.file.location || '/uploads/' + req.file.filename) : undefined;
  const course = await Course.create({ schoolId: req.user.schoolId, branchId: branchId||req.user.branchId, title, description, level, coverImage, createdBy: req.user._id });
  res.status(201).json(ApiResponse.success(course, 'Course created'));
});
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('createdBy','name').populate('assignedTo','name email');
  if (!course) throw new ApiError(404, 'Course not found');
  res.json(ApiResponse.success(course));
});
const updateCourse = asyncHandler(async (req, res) => {
  const updates = Object.assign({}, req.body);
  if (req.file) updates.coverImage = req.file.location || '/uploads/' + req.file.filename;
  const course = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json(ApiResponse.success(course, 'Updated'));
});
const deleteCourse = asyncHandler(async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json(ApiResponse.success(null, 'Course deleted'));
});
const enrollStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const course = await Course.findByIdAndUpdate(req.params.id, { $addToSet: { assignedTo: { $each: studentIds } } }, { new: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json(ApiResponse.success(course, 'Students enrolled'));
});
const getModules = asyncHandler(async (req, res) => {
  const modules = await Module.find({ courseId: req.params.courseId }).sort('order');
  res.json(ApiResponse.success(modules));
});
const createModule = asyncHandler(async (req, res) => {
  const mod = await Module.create({ schoolId: req.user.schoolId, branchId: req.user.branchId, courseId: req.params.courseId, title: req.body.title, order: req.body.order||0 });
  res.status(201).json(ApiResponse.success(mod, 'Module created'));
});
const updateModule = asyncHandler(async (req, res) => {
  const mod = await Module.findByIdAndUpdate(req.params.moduleId, req.body, { new: true });
  res.json(ApiResponse.success(mod, 'Module updated'));
});
const deleteModule = asyncHandler(async (req, res) => {
  await Module.findByIdAndDelete(req.params.moduleId);
  res.json(ApiResponse.success(null, 'Module deleted'));
});
const getLessons = asyncHandler(async (req, res) => {
  const lessons = await Lesson.find({ moduleId: req.params.moduleId }).sort('order');
  res.json(ApiResponse.success(lessons));
});
const createLesson = asyncHandler(async (req, res) => {
  const { title, description, order, isLocked, unlockAfter } = req.body;
  const lesson = await Lesson.create({ schoolId: req.user.schoolId, branchId: req.user.branchId, moduleId: req.params.moduleId, title, description, order: order||0, isLocked: isLocked!==false, unlockAfter });
  res.status(201).json(ApiResponse.success(lesson, 'Lesson created'));
});
const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndUpdate(req.params.lessonId, req.body, { new: true });
  res.json(ApiResponse.success(lesson, 'Updated'));
});
const deleteLesson = asyncHandler(async (req, res) => {
  await Lesson.findByIdAndDelete(req.params.lessonId);
  res.json(ApiResponse.success(null, 'Lesson deleted'));
});
const unlockLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndUpdate(req.params.lessonId, { isLocked: false }, { new: true });
  res.json(ApiResponse.success(lesson, 'Lesson unlocked'));
});
const getMaterials = asyncHandler(async (req, res) => {
  const materials = await Material.find({ lessonId: req.params.lessonId }).sort('order');
  res.json(ApiResponse.success(materials));
});
const addMaterial = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'File required');
  const url = req.file.location || '/uploads/' + req.file.filename;
  const material = await Material.create({ schoolId: req.user.schoolId, branchId: req.user.branchId, lessonId: req.params.lessonId, title: req.body.title, type: req.body.type, url, size: req.file.size, order: req.body.order||0, uploadedBy: req.user._id });
  res.status(201).json(ApiResponse.success(material, 'Material uploaded'));
});
const deleteMaterial = asyncHandler(async (req, res) => {
  await Material.findByIdAndDelete(req.params.materialId);
  res.json(ApiResponse.success(null, 'Material deleted'));
});
const getMyProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const filter = { studentId: req.user._id };
  if (courseId) filter.courseId = courseId;
  const progress = await Progress.find(filter).populate('lessonId','title');
  res.json(ApiResponse.success(progress));
});
const markComplete = asyncHandler(async (req, res) => {
  const { lessonId } = req.body;
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  const mod = await Module.findById(lesson.moduleId);
  await Progress.findOneAndUpdate(
    { studentId: req.user._id, lessonId },
    { schoolId: req.user.schoolId, courseId: mod.courseId, completedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json(ApiResponse.success(null, 'Lesson marked complete'));
});
module.exports = { getCourses, createCourse, getCourse, updateCourse, deleteCourse, enrollStudents, getModules, createModule, updateModule, deleteModule, getLessons, createLesson, updateLesson, deleteLesson, unlockLesson, getMaterials, addMaterial, deleteMaterial, getMyProgress, markComplete };
