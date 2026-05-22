const router = require('express').Router();
const c = require('./learn.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.post('/track',    c.track);
router.get('/progress',  c.myProgress);
router.get('/overview',  c.overview);
module.exports = router;
