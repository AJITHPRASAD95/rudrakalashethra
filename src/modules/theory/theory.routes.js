const router = require('express').Router();
const c = require('./theory.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');
const upload      = require('../../config/storage');

router.use(protect);
router.get('/',    c.list);
router.get('/:id', c.getOne);

const ADMIN = ['super_admin','branch_manager','teacher'];
const cover = upload.fields([{ name:'cover', maxCount: 1 }]);

router.post('/',      permit(...ADMIN), cover, c.create);
router.put('/:id',    permit(...ADMIN), cover, c.update);
router.delete('/:id', permit('super_admin','branch_manager'), c.remove);
module.exports = router;
