const router = require('express').Router();
const c = require('./auth.controller');
const { protect } = require('../../middleware/auth');
router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh-token', c.refreshToken);
router.get('/me', protect, c.getMe);
router.post('/logout', protect, c.logout);
module.exports = router;
