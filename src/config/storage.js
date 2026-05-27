const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

function typeFilter(req, file, cb) {
  /jpeg|jpg|png|gif|mp4|webm|mov|pdf|mp3|m4a|aac/.test(file.mimetype)
    ? cb(null, true) : cb(new Error('File type not allowed'));
}

let upload;
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

function folderFor(file) {
  return file.mimetype.startsWith('video') ? 'videos'
    : file.mimetype === 'application/pdf' ? 'pdfs'
    : file.mimetype.startsWith('audio') ? 'audio' : 'images';
}

function safeName(name) {
  return path.parse(name).name.replace(/\s/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
}

function localStorage() {
  const dir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,'_')),
  });
}

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const disk = localStorage();
  const cloudinaryImageStorage = {
    _handleFile(req, file, cb) {
      if (!file.mimetype.startsWith('image/')) {
        return disk._handleFile(req, file, cb);
      }

      const folder = `${req.user && req.user.schoolId || 'g'}/images`;
      const publicId = `${Date.now()}-${safeName(file.originalname)}`;
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: publicId, resource_type: 'image' },
        (err, result) => {
          if (err) return cb(err);
          cb(null, {
            path: result.public_id,
            filename: result.public_id,
            location: result.secure_url,
            size: result.bytes,
            mimetype: file.mimetype,
          });
        }
      );
      file.stream.pipe(stream);
    },
    _removeFile(req, file, cb) {
      if (file.path && file.location) {
        return cloudinary.uploader.destroy(file.path, { resource_type: 'image' }, () => cb(null));
      }
      if (file.path) return fs.unlink(file.path, cb);
      cb(null);
    },
  };

  upload = multer({
    storage: cloudinaryImageStorage,
    limits: { fileSize: 500*1024*1024 },
    fileFilter: typeFilter,
  });
} else if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET) {
  const { S3Client } = require('@aws-sdk/client-s3');
  const multerS3 = require('multer-s3');
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
  });
  upload = multer({
    storage: multerS3({
      s3, bucket: process.env.S3_BUCKET, contentType: multerS3.AUTO_CONTENT_TYPE,
      key(req, file, cb) {
        const folder = folderFor(file);
        cb(null, `${req.user && req.user.schoolId || 'g'}/${folder}/${Date.now()}-${file.originalname.replace(/\s/g,'_')}`);
      },
    }),
    limits: { fileSize: 500*1024*1024 }, fileFilter: typeFilter,
  });
} else {
  upload = multer({
    storage: localStorage(),
    limits: { fileSize: 500*1024*1024 }, fileFilter: typeFilter,
  });
}
module.exports = upload;
