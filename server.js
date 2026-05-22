require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dance School API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}).catch(err => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', err => { console.error(err); process.exit(1); });
