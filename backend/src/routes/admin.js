const express = require('express');
const router = express.Router();
const {
  listUsers,
  verifyUser,
  deleteUser,
  listAllDonations,
  getStats,
  getCertificateCandidates,
  generateCertificate,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);
router.get('/donations', listAllDonations);
router.get('/stats', getStats);
router.get('/certificates/candidates', getCertificateCandidates);
router.post('/certificates', generateCertificate);
module.exports = router;
