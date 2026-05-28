const Content    = require('../../models/Content');
const ApiError   = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const DEFAULT_CATEGORIES = ['Mudras','Adavus','Theory','Abhinaya','Footwork','Hastas','Nritta','Natya'];

/** Detect youtube/vimeo and extract id + thumbnail. Returns {source, embedId, thumbnail} or null. */
function parseEmbed(url) {
  if (!url) return null;
  // YouTube — youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>, youtube.com/shorts/<id>
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return { source: 'youtube', embedId: m[1], thumbnail: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` };
  // Vimeo — vimeo.com/<id>
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { source: 'vimeo', embedId: m[1] };
  return null;
}

function isHttpUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch (_) {
    return false;
  }
}

const getCategories = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  const existing = await Content.distinct('category', filter);
  const all = [...new Set([...DEFAULT_CATEGORIES, ...existing])].sort();
  const counts = await Content.aggregate([
    { $match: filter },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id] = c.count; });
  const categories = all.map(name => ({ name, count: countMap[name] || 0 }));
  res.json(ApiResponse.success(categories));
});

const getContent = asyncHandler(async (req, res) => {
  const { category, type, page=1, limit=20, search } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const total = await Content.countDocuments(filter);
  const items = await Content.find(filter)
    .populate('uploadedBy','name')
    .sort('order -createdAt')
    .skip((page-1)*limit).limit(+limit);
  res.json(ApiResponse.paginated(items, total, page, limit));
});

const getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  const item = await Content.findOne(filter).populate('uploadedBy','name');
  if (!item) throw new ApiError(404, 'Content not found');
  res.json(ApiResponse.success(item));
});

const createContent = asyncHandler(async (req, res) => {
  const { category, title, description, type, tags, order, embedUrl } = req.body;
  if (!category || !title || !type) throw new ApiError(400, 'category, title, type required');

  let url, thumbnail, size, source = 'upload', embedId;
  const mainFile  = req.files && req.files['file'] && req.files['file'][0];
  const thumbFile = req.files && req.files['thumbnail'] && req.files['thumbnail'][0];
  if (thumbFile) thumbnail = thumbFile.location || '/uploads/' + thumbFile.filename;

  // Embed (YouTube / Vimeo) — when admin pastes a link instead of uploading
  if (embedUrl && embedUrl.trim()) {
    const externalUrl = embedUrl.trim();
    if (!isHttpUrl(externalUrl)) throw new ApiError(400, 'A valid http/https URL is required');
    const parsed = parseEmbed(externalUrl);
    url = externalUrl;
    if (parsed) {
      source = parsed.source;
      embedId = parsed.embedId;
      thumbnail = thumbnail || parsed.thumbnail;
    } else {
      if (!['video','pdf','audio'].includes(type)) throw new ApiError(400, 'External URL is supported for video, PDF and audio. Upload image files directly.');
      source = 'external';
    }
  } else {
    if (!mainFile) throw new ApiError(400, 'File or URL is required');
    url       = mainFile.location  || '/uploads/' + mainFile.filename;
    size      = mainFile.size;
  }

  const content = await Content.create({
    schoolId: req.user.schoolId,
    branchId: req.user.branchId,
    category, title, description, type, url, source, embedId, thumbnail, size,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t=>t.trim()).filter(Boolean)) : [],
    order: order || 0,
    uploadedBy: req.user._id,
  });
  res.status(201).json(ApiResponse.success(content, 'Content created'));
});

const updateContent = asyncHandler(async (req, res) => {
  const allowed = ['title','description','category','tags','order','isPublished'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (updates.tags && typeof updates.tags === 'string')
    updates.tags = updates.tags.split(',').map(t=>t.trim()).filter(Boolean);
  const content = await Content.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    updates, { new: true }
  );
  if (!content) throw new ApiError(404, 'Content not found');
  res.json(ApiResponse.success(content, 'Updated'));
});

const deleteContent = asyncHandler(async (req, res) => {
  await Content.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
  res.json(ApiResponse.success(null, 'Deleted'));
});

module.exports = { getCategories, getContent, getOne, createContent, updateContent, deleteContent };
