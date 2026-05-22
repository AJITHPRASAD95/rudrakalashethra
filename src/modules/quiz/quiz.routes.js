const router = require('express').Router();
const c = require('./quiz.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');

router.use(protect);
router.get('/',          c.list);
router.get('/:id',       c.getOne);
router.post('/:id/submit', c.submit);

const ADMIN = ['super_admin','branch_manager','teacher'];
router.post('/',      permit(...ADMIN), c.create);
router.put('/:id',    permit(...ADMIN), c.update);
router.delete('/:id', permit('super_admin','branch_manager'), c.remove);

module.exports = router;
