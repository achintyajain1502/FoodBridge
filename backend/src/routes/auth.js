const express = require('express');
const router = express.Router();
const {
  register,
  login,
  me,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, me);

module.exports = router;
