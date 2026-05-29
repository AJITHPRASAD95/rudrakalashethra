const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '*').split(','),
  credentials: true,
}));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 300,
  message: { success: false, message: 'Too many requests.' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/api/v1/auth',          require('./modules/auth/auth.routes'));
app.use('/api/v1/branches',      require('./modules/branch/branch.routes'));
app.use('/api/v1/users',         require('./modules/user/user.routes'));
app.use('/api/v1/courses',       require('./modules/course/course.routes'));
app.use('/api/v1/classes',       require('./modules/class/class.routes'));
app.use('/api/v1/submissions',   require('./modules/submission/submission.routes'));
app.use('/api/v1/payments',      require('./modules/payment/payment.routes'));
app.use('/api/v1/attendance',    require('./modules/attendance/attendance.routes'));
app.use('/api/v1/notifications', require('./modules/notification/notification.routes'));
app.use('/api/v1/dashboard',     require('./modules/dashboard/dashboard.routes'));
app.use('/api/v1/fees',          require('./modules/fee/fee.routes'));
app.use('/api/v1/content',       require('./modules/content/content.routes'));
app.use('/api/v1/mudras',        require('./modules/mudra/mudra.routes'));
app.use('/api/v1/theory',        require('./modules/theory/theory.routes'));
app.use('/api/v1/quizzes',       require('./modules/quiz/quiz.routes'));
app.use('/api/v1/learn',         require('./modules/learn/learn.routes'));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success:false, message:'API route not found' });
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
