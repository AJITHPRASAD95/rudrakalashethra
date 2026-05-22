const Quiz          = require('../../models/Quiz');
const LearnProgress = require('../../models/LearnProgress');
const ApiError      = require('../../utils/ApiError');
const ApiResponse   = require('../../utils/ApiResponse');
const asyncHandler  = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { category, search, page=1, limit=20 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  if (category && category !== 'all') filter.category = category;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const total = await Quiz.countDocuments(filter);
  let q = Quiz.find(filter).sort('-createdAt').skip((page-1)*limit).limit(+limit);
  if (req.user.role === 'student') q = q.select('-questions.correctIndex -questions.explanation');
  const items = await q;
  res.json(ApiResponse.paginated(items, total, page, limit));
});

const getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  let q = Quiz.findOne(filter);
  // Students must not see correct answers up-front
  if (req.user.role === 'student') q = q.select('-questions.correctIndex -questions.explanation');
  const quiz = await q;
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  res.json(ApiResponse.success(quiz));
});

function normaliseQuestions(input) {
  if (!Array.isArray(input)) throw new ApiError(400, 'questions must be an array');
  return input.map((q, i) => {
    if (!q.prompt) throw new ApiError(400, `Question ${i+1}: prompt required`);
    if (!Array.isArray(q.options) || q.options.length < 2) throw new ApiError(400, `Question ${i+1}: at least 2 options required`);
    const ci = Number(q.correctIndex);
    if (Number.isNaN(ci) || ci < 0 || ci >= q.options.length) throw new ApiError(400, `Question ${i+1}: correctIndex out of range`);
    return { prompt: q.prompt, options: q.options, correctIndex: ci, explanation: q.explanation || '' };
  });
}

const create = asyncHandler(async (req, res) => {
  const { title, description, category, questions, passingScore } = req.body;
  if (!title) throw new ApiError(400, 'title required');
  const qs = normaliseQuestions(questions);
  const quiz = await Quiz.create({
    schoolId: req.user.schoolId,
    title, description,
    category: category || 'General',
    questions: qs,
    passingScore: passingScore != null ? Number(passingScore) : 60,
    createdBy: req.user._id,
  });
  res.status(201).json(ApiResponse.success(quiz, 'Quiz created'));
});

const update = asyncHandler(async (req, res) => {
  const updates = {};
  ['title','description','category','passingScore','isPublished'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  if (req.body.questions) updates.questions = normaliseQuestions(req.body.questions);
  const quiz = await Quiz.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    updates, { new: true }
  );
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  res.json(ApiResponse.success(quiz, 'Updated'));
});

const remove = asyncHandler(async (req, res) => {
  await Quiz.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
  res.json(ApiResponse.success(null, 'Deleted'));
});

/** Student submits answers — server grades and stores progress. */
const submit = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    // Allow staff to also take quizzes but don't write progress
  }
  const quiz = await Quiz.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!quiz) throw new ApiError(404, 'Quiz not found');

  const answers = req.body.answers; // array of selected indices, same length as questions
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length)
    throw new ApiError(400, `Expected ${quiz.questions.length} answers`);

  let correct = 0;
  const review = quiz.questions.map((q, i) => {
    const chosen   = Number(answers[i]);
    const isRight  = chosen === q.correctIndex;
    if (isRight) correct++;
    return {
      prompt: q.prompt,
      options: q.options,
      chosen,
      correctIndex: q.correctIndex,
      isRight,
      explanation: q.explanation,
    };
  });
  const score = Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= (quiz.passingScore || 60);

  // Update progress for students
  if (req.user.role === 'student') {
    const existing = await LearnProgress.findOne({
      studentId: req.user._id, itemType: 'quiz', itemId: quiz._id,
    });
    const bestScore = Math.max(existing ? (existing.bestScore || 0) : 0, score);
    await LearnProgress.findOneAndUpdate(
      { studentId: req.user._id, itemType: 'quiz', itemId: quiz._id },
      {
        schoolId: req.user.schoolId,
        status: passed ? 'completed' : 'practiced',
        score,
        bestScore,
        $inc: { attempts: 1 },
        lastAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  res.json(ApiResponse.success({
    score, correct, total: quiz.questions.length, passed, passingScore: quiz.passingScore, review,
  }, passed ? 'Passed!' : 'Quiz submitted'));
});

module.exports = { list, getOne, create, update, remove, submit };
