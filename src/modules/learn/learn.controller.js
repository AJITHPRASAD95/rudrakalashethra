const LearnProgress = require('../../models/LearnProgress');
const Mudra         = require('../../models/Mudra');
const Article       = require('../../models/TheoryArticle');
const Quiz          = require('../../models/Quiz');
const Content       = require('../../models/Content');
const ApiError      = require('../../utils/ApiError');
const ApiResponse   = require('../../utils/ApiResponse');
const asyncHandler  = require('../../utils/asyncHandler');

/** Mark / update progress for a single item.
 *  Body: { itemType: 'mudra'|'theory'|'video'|'quiz', itemId, status?: 'viewed'|'practiced'|'completed' }
 */
const track = asyncHandler(async (req, res) => {
  const { itemType, itemId, status } = req.body;
  if (!['mudra','theory','video','quiz'].includes(itemType)) throw new ApiError(400, 'Invalid itemType');
  if (!itemId) throw new ApiError(400, 'itemId required');

  const newStatus = status && ['viewed','practiced','completed'].includes(status) ? status : 'viewed';

  // Preserve highest-tier status — don't downgrade completed -> viewed
  const RANK = { viewed: 0, practiced: 1, completed: 2 };
  const existing = await LearnProgress.findOne({
    studentId: req.user._id, itemType, itemId,
  });
  const finalStatus = (existing && RANK[existing.status] >= RANK[newStatus]) ? existing.status : newStatus;

  const doc = await LearnProgress.findOneAndUpdate(
    { studentId: req.user._id, itemType, itemId },
    { schoolId: req.user.schoolId, status: finalStatus, lastAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(ApiResponse.success(doc, 'Progress saved'));
});

/** Get my progress map for a list of items. Query: ?itemType=mudra */
const myProgress = asyncHandler(async (req, res) => {
  const filter = { studentId: req.user._id };
  if (req.query.itemType) filter.itemType = req.query.itemType;
  const items = await LearnProgress.find(filter).lean();
  // Reshape into a lookup by itemId
  const map = {};
  items.forEach(p => { map[String(p.itemId)] = p; });
  res.json(ApiResponse.success({ items, map }));
});

/** Aggregate overview for the student dashboard. */
const overview = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const [mudraTotal, theoryTotal, videoTotal, quizTotal, progress] = await Promise.all([
    Mudra.countDocuments({ schoolId, isPublished: true }),
    Article.countDocuments({ schoolId, isPublished: true }),
    Content.countDocuments({ schoolId, isPublished: true, type: 'video' }),
    Quiz.countDocuments({ schoolId, isPublished: true }),
    LearnProgress.find({ studentId: req.user._id }).lean(),
  ]);

  const count = (type, st) => progress.filter(p => p.itemType === type && (!st || p.status === st)).length;
  const pct   = (done, total) => total ? Math.round((done / total) * 100) : 0;

  const quizScores = progress.filter(p => p.itemType === 'quiz' && typeof p.bestScore === 'number').map(p => p.bestScore);
  const avgQuiz = quizScores.length ? Math.round(quizScores.reduce((a,b)=>a+b,0) / quizScores.length) : null;

  res.json(ApiResponse.success({
    mudras:  { total: mudraTotal,  viewed: count('mudra'),  completed: count('mudra','completed'),  percent: pct(count('mudra','completed'),  mudraTotal)  },
    theory:  { total: theoryTotal, viewed: count('theory'), completed: count('theory','completed'), percent: pct(count('theory','completed'), theoryTotal) },
    videos:  { total: videoTotal,  viewed: count('video'),  completed: count('video','completed'),  percent: pct(count('video','completed'),  videoTotal)  },
    quizzes: { total: quizTotal,   viewed: count('quiz'),   completed: count('quiz','completed'),   percent: pct(count('quiz','completed'),   quizTotal), avgScore: avgQuiz },
    recent:  progress.sort((a,b)=> new Date(b.lastAt) - new Date(a.lastAt)).slice(0, 8),
  }));
});

module.exports = { track, myProgress, overview };
