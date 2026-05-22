const router = require('express').Router();
const c = require('./fee.controller');
const { protect } = require('../../middleware/auth');
const { permit } = require('../../middleware/rbac');
router.use(protect);
router.get('/',     c.getFeeStructures);
router.post('/',    permit('super_admin','branch_manager'), c.createFeeStructure);
router.put('/:id',  permit('super_admin','branch_manager'), c.updateFeeStructure);
router.delete('/:id', permit('super_admin','branch_manager'), c.deleteFeeStructure);
// Apply fee structure to a student — creates a Payment record
router.post('/:id/apply', permit('super_admin','branch_manager'), c.applyFeeToStudent);
module.exports = router;
