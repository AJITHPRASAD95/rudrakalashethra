const ApiError = require('../utils/ApiError');
const scopeBranch = (req, res, next) => {
  const { role, branchId, schoolId } = req.user;
  req.schoolFilter = { schoolId };
  if (role === 'super_admin') { req.branchFilter = {}; return next(); }
  const requested = req.params.branchId || req.body.branchId || req.query.branchId;
  if (requested && requested !== (branchId && branchId.toString()))
    throw new ApiError(403, 'You do not have access to this branch');
  req.branchFilter = { branchId };
  next();
};
module.exports = { scopeBranch };
