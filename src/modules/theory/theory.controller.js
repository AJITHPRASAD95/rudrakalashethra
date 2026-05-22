const Article      = require('../../models/TheoryArticle');
const ApiError     = require('../../utils/ApiError');
const ApiResponse  = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { category, search, page=1, limit=20 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  if (category && category !== 'all') filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags:  { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Article.countDocuments(filter);
  const items = await Article.find(filter)
    .select('-body') // exclude heavy body in list
    .sort('order -createdAt')
    .skip((page-1)*limit).limit(+limit);
  res.json(ApiResponse.paginated(items, total, page, limit));
});

const getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  const a = await Article.findOne(filter);
  if (!a) throw new ApiError(404, 'Article not found');
  res.json(ApiResponse.success(a));
});

function estimateMinutes(text) {
  const words = (text || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const create = asyncHandler(async (req, res) => {
  const { title, subtitle, category, body, tags, order } = req.body;
  if (!title || !body) throw new ApiError(400, 'title and body are required');

  const coverFile = req.files && req.files['cover'] && req.files['cover'][0];
  const coverImage = coverFile ? (coverFile.location || '/uploads/' + coverFile.filename) : undefined;

  const article = await Article.create({
    schoolId: req.user.schoolId,
    title, subtitle,
    category: category || 'General',
    coverImage, body,
    readMinutes: estimateMinutes(body),
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t=>t.trim()).filter(Boolean)) : [],
    order: order || 0,
    createdBy: req.user._id,
  });
  res.status(201).json(ApiResponse.success(article, 'Article created'));
});

const update = asyncHandler(async (req, res) => {
  const allowed = ['title','subtitle','category','body','tags','order','isPublished','subtitle'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (updates.tags && typeof updates.tags === 'string')
    updates.tags = updates.tags.split(',').map(t=>t.trim()).filter(Boolean);
  if (updates.body) updates.readMinutes = estimateMinutes(updates.body);

  const coverFile = req.files && req.files['cover'] && req.files['cover'][0];
  if (coverFile) updates.coverImage = coverFile.location || '/uploads/' + coverFile.filename;

  const a = await Article.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    updates, { new: true }
  );
  if (!a) throw new ApiError(404, 'Article not found');
  res.json(ApiResponse.success(a, 'Updated'));
});

const remove = asyncHandler(async (req, res) => {
  await Article.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
  res.json(ApiResponse.success(null, 'Deleted'));
});

module.exports = { list, getOne, create, update, remove };
