const multer = require('multer');
const path = require('path');
const fs = require('fs');

function typeFilter(req, file, cb) {
  /jpeg|jpg|png|gif|mp4|webm|mov|pdf|mp3|m4a|aac/.test(file.mimetype)
    ? cb(null, true) : cb(new Error('File type not allowed'));
}

let upload;
if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET) {
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
        const folder = file.mimetype.startsWith('video') ? 'videos'
          : file.mimetype === 'application/pdf' ? 'pdfs'
          : file.mimetype.startsWith('audio') ? 'audio' : 'images';
        cb(null, `${req.user && req.user.schoolId || 'g'}/${folder}/${Date.now()}-${file.originalname.replace(/\s/g,'_')}`);
      },
    }),
    limits: { fileSize: 500*1024*1024 }, fileFilter: typeFilter,
  });
} else {
  const dir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,'_')),
    }),
    limits: { fileSize: 500*1024*1024 }, fileFilter: typeFilter,
  });
}
module.exports = upload;
