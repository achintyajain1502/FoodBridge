const express = require('express');
const router = express.Router();
const {
  createDonation,
  getAvailableDonations,
  acceptDonation,
  completeDonation,
  cancelDonation,
  getMyDonations,
  getDonationHistory,
} = require('../controllers/donationController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/', requireAuth, requireRole('donor'), createDonation);
router.get('/available', requireAuth, requireRole('ngo'), getAvailableDonations);
router.get('/mine', requireAuth, requireRole('donor', 'ngo'), getMyDonations);
router.get('/:id/history', requireAuth, getDonationHistory);
router.patch('/:id/accept', requireAuth, requireRole('ngo'), acceptDonation);
router.patch('/:id/complete', requireAuth, requireRole('ngo'), completeDonation);
router.patch('/:id/cancel', requireAuth, requireRole('donor'), cancelDonation);

module.exports = router;
