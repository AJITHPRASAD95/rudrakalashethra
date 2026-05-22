const router = require('express').Router();
const c = require('./dashboard.controller');
const { protect } = require('../../middleware/auth');
const { permit } = require('../../middleware/rbac');
router.use(protect, permit('super_admin','branch_manager'));
router.get('/', c.getOverview);
router.get('/revenue', c.getRevenue);
router.get('/attendance', c.getAttendanceStats);
module.exports = router;
