const router = require('express').Router();
const c = require('./content.controller');
const { protect } = require('../../middleware/auth');
const { permit } = require('../../middleware/rbac');
const upload = require('../../config/storage');
router.use(protect);
router.get('/categories', c.getCategories);
router.get('/',           c.getContent);
router.get('/:id',        c.getOne);
router.post('/',          permit('super_admin','branch_manager','teacher'),
  upload.fields([{ name:'file',maxCount:1 },{ name:'thumbnail',maxCount:1 }]),
  c.createContent);
router.put('/:id',        permit('super_admin','branch_manager','teacher'), c.updateContent);
router.delete('/:id',     permit('super_admin','branch_manager'), c.deleteContent);
module.exports = router;
