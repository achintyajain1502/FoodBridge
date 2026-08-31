const express = require('express');

const router = express.Router();

const { generateCertificate } = require('../controllers/certificateController');
const { requireAuth } = require('../middleware/auth');

router.get('/donation/:id', requireAuth, generateCertificate);

module.exports = router;