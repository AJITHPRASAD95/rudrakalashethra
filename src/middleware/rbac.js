const ApiError = require('../utils/ApiError');
const permit = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    throw new ApiError(403, 'Access denied. Required: ' + roles.join(' or '));
  next();
};
module.exports = { permit };
