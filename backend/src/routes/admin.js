const express = require('express');
const router = express.Router();
const {
  listUsers,
  verifyUser,
  deleteUser,
  listAllDonations,
  getStats,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);
router.get('/donations', listAllDonations);
router.get('/stats', getStats);

module.exports = router;
