const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Not authenticated. Token missing.');
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch(e) { throw new ApiError(401, 'Invalid or expired token'); }
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) throw new ApiError(401, 'User not found or deactivated');
  req.user = user;
  next();
});

module.exports = { protect };
