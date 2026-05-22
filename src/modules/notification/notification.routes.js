const router = require('express').Router();
const c = require('./notification.controller');
const { protect } = require('../../middleware/auth');
const { permit } = require('../../middleware/rbac');
router.use(protect);
router.post('/send', permit('super_admin','branch_manager'), c.sendNotification);
router.post('/reminder/:classId', permit('super_admin','branch_manager','teacher'), c.sendClassReminder);
module.exports = router;
