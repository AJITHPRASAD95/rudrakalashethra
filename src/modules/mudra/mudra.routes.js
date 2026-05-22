const router = require('express').Router();
const c = require('./mudra.controller');
const { protect } = require('../../middleware/auth');
const { permit }  = require('../../middleware/rbac');
const upload      = require('../../config/storage');

router.use(protect);

router.get('/',     c.list);
router.get('/:id',  c.getOne);

const ADMIN = ['super_admin','branch_manager','teacher'];
const fileFields = upload.fields([{ name:'image', maxCount:1 }, { name:'video', maxCount:1 }]);

router.post('/',      permit(...ADMIN), fileFields, c.create);
router.put('/:id',    permit(...ADMIN), fileFields, c.update);
router.delete('/:id', permit('super_admin','branch_manager'), c.remove);

module.exports = router;
