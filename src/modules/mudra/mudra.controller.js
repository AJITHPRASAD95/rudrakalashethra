const Mudra        = require('../../models/Mudra');
const ApiError     = require('../../utils/ApiError');
const ApiResponse  = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

function parseEmbed(url) {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return { source: 'youtube', id: m[1] };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { source: 'vimeo', id: m[1] };
  return null;
}

const list = asyncHandler(async (req, res) => {
  const { category, search, page=1, limit=24 } = req.query;
  const filter = { schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  if (category && category !== 'all') filter.category = category;
  if (search) {
    filter.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { sanskritName:{ $regex: search, $options: 'i' } },
      { meaning:     { $regex: search, $options: 'i' } },
      { tags:        { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Mudra.countDocuments(filter);
  const items = await Mudra.find(filter)
    .sort('category order name')
    .skip((page-1)*limit).limit(+limit);
  res.json(ApiResponse.paginated(items, total, page, limit));
});

const getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, schoolId: req.user.schoolId };
  if (req.user.role === 'student') filter.isPublished = true;
  const m = await Mudra.findOne(filter);
  if (!m) throw new ApiError(404, 'Mudra not found');
  res.json(ApiResponse.success(m));
});

const create = asyncHandler(async (req, res) => {
  const { name, sanskritName, category, meaning, description, usage, tags, order, videoEmbedUrl } = req.body;
  if (!name) throw new ApiError(400, 'name is required');

  const imageFile = req.files && req.files['image'] && req.files['image'][0];
  const videoFile = req.files && req.files['video'] && req.files['video'][0];

  let videoUrl, videoSource = 'none';
  if (videoEmbedUrl && videoEmbedUrl.trim()) {
    const p = parseEmbed(videoEmbedUrl.trim());
    if (!p) throw new ApiError(400, 'Video URL must be YouTube or Vimeo');
    videoUrl = videoEmbedUrl.trim();
    videoSource = p.source;
  } else if (videoFile) {
    videoUrl = videoFile.location || '/uploads/' + videoFile.filename;
    videoSource = 'upload';
  }

  const image = imageFile ? (imageFile.location || '/uploads/' + imageFile.filename) : undefined;

  const mudra = await Mudra.create({
    schoolId: req.user.schoolId,
    name, sanskritName,
    category: category || 'Asamyukta',
    image, videoUrl, videoSource,
    meaning, description, usage,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t=>t.trim()).filter(Boolean)) : [],
    order: order || 0,
    createdBy: req.user._id,
  });
  res.status(201).json(ApiResponse.success(mudra, 'Mudra created'));
});

const update = asyncHandler(async (req, res) => {
  const allowed = ['name','sanskritName','category','meaning','description','usage','tags','order','isPublished'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (updates.tags && typeof updates.tags === 'string')
    updates.tags = updates.tags.split(',').map(t=>t.trim()).filter(Boolean);

  // Optional image / video replacement
  const imageFile = req.files && req.files['image'] && req.files['image'][0];
  if (imageFile) updates.image = imageFile.location || '/uploads/' + imageFile.filename;

  const videoFile = req.files && req.files['video'] && req.files['video'][0];
  if (req.body.videoEmbedUrl && req.body.videoEmbedUrl.trim()) {
    const p = parseEmbed(req.body.videoEmbedUrl.trim());
    if (!p) throw new ApiError(400, 'Video URL must be YouTube or Vimeo');
    updates.videoUrl = req.body.videoEmbedUrl.trim();
    updates.videoSource = p.source;
  } else if (videoFile) {
    updates.videoUrl = videoFile.location || '/uploads/' + videoFile.filename;
    updates.videoSource = 'upload';
  }

  const mudra = await Mudra.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    updates, { new: true }
  );
  if (!mudra) throw new ApiError(404, 'Mudra not found');
  res.json(ApiResponse.success(mudra, 'Updated'));
});

const remove = asyncHandler(async (req, res) => {
  await Mudra.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
  res.json(ApiResponse.success(null, 'Deleted'));
});

module.exports = { list, getOne, create, update, remove };
