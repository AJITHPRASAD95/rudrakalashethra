const mongoose = require('mongoose');
const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI env not set');
  await mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10 });
  console.log('[db] MongoDB connected:', mongoose.connection.host);
};
module.exports = { connectDB };
