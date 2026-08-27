const pool = require('../config/db');

async function logStatus(donationId, status, changedBy, note = null) {
  await pool.query(
    `INSERT INTO donation_status_log (donation_id, status, changed_by, note)
     VALUES ($1, $2, $3, $4)`,
    [donationId, status, changedBy, note]
  );
}

// POST /api/donations  (donor only)
async function createDonation(req, res) {
  try {
    const { food_type, quantity, unit, description, pickup_address, city, expiry_time } = req.body;

    if (!food_type || !quantity || !pickup_address || !city || !expiry_time) {
      return res.status(400).json({
        error: 'food_type, quantity, pickup_address, city and expiry_time are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO donations (donor_id, food_type, quantity, unit, description, pickup_address, city, expiry_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        food_type,
        quantity,
        unit || 'kg',
        description || null,
        pickup_address,
        city,
        expiry_time,
      ]
    );

    const donation = result.rows[0];
    await logStatus(donation.id, 'available', req.user.id, 'Donation posted');

    res.status(201).json({ donation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create donation' });
  }
}

// GET /api/donations/available  (ngo only) — optional ?city= filter
async function getAvailableDonations(req, res) {
  try {
    // Auto-expire anything past its expiry_time before returning results
    await pool.query(
      `UPDATE donations SET status = 'expired'
       WHERE status = 'available' AND expiry_time < NOW()`
    );

    const { city } = req.query;
    const params = [];
    let query = `
      SELECT d.*, u.name AS donor_name, u.phone AS donor_phone
      FROM donations d
      JOIN users u ON u.id = d.donor_id
      WHERE d.status = 'available'
    `;
    if (city) {
      params.push(city);
      query += ` AND d.city = $${params.length}`;
    }
    query += ' ORDER BY d.expiry_time ASC';

    const result = await pool.query(query, params);
    res.json({ donations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch available donations' });
  }
}

// PATCH /api/donations/:id/accept  (ngo only)
async function acceptDonation(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Donation not found' });
    if (existing.rows[0].status !== 'available') {
      return res.status(409).json({ error: `Donation is already ${existing.rows[0].status}` });
    }

    const result = await pool.query(
      `UPDATE donations
       SET status = 'accepted', ngo_id = $1, accepted_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    await logStatus(id, 'accepted', req.user.id);
    res.json({ donation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not accept donation' });
  }
}

// PATCH /api/donations/:id/complete  (ngo only — the NGO that accepted it)
async function completeDonation(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Donation not found' });

    const donation = existing.rows[0];
    if (donation.ngo_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the NGO that accepted this donation can complete it' });
    }
    if (donation.status !== 'accepted') {
      return res.status(409).json({ error: `Donation must be accepted before it can be completed` });
    }

    const result = await pool.query(
      `UPDATE donations SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    await logStatus(id, 'completed', req.user.id);
    res.json({ donation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not complete donation' });
  }
}

// PATCH /api/donations/:id/cancel  (donor only — their own, while still available)
async function cancelDonation(req, res) {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Donation not found' });

    const donation = existing.rows[0];
    if (donation.donor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own donations' });
    }
    if (donation.status !== 'available') {
      return res.status(409).json({ error: 'Only donations that are still available can be cancelled' });
    }

    const result = await pool.query(
      `UPDATE donations SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );

    await logStatus(id, 'cancelled', req.user.id);
    res.json({ donation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not cancel donation' });
  }
}

// GET /api/donations/mine  (donor: donations they posted | ngo: donations they accepted)
async function getMyDonations(req, res) {
  try {
    let query;
    if (req.user.role === 'donor') {
      query = `
        SELECT d.*, u.name AS ngo_name
        FROM donations d
        LEFT JOIN users u ON u.id = d.ngo_id
        WHERE d.donor_id = $1
        ORDER BY d.created_at DESC
      `;
    } else if (req.user.role === 'ngo') {
      query = `
        SELECT d.*, u.name AS donor_name
        FROM donations d
        JOIN users u ON u.id = d.donor_id
        WHERE d.ngo_id = $1
        ORDER BY d.created_at DESC
      `;
    } else {
      return res.status(403).json({ error: 'Only donors and NGOs have a personal donation list' });
    }

    const result = await pool.query(query, [req.user.id]);
    res.json({ donations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch your donations' });
  }
}

// GET /api/donations/:id/history  (status log for one donation)
async function getDonationHistory(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.*, u.name AS changed_by_name
       FROM donation_status_log l
       LEFT JOIN users u ON u.id = l.changed_by
       WHERE l.donation_id = $1
       ORDER BY l.changed_at ASC`,
      [id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch donation history' });
  }
}

module.exports = {
  createDonation,
  getAvailableDonations,
  acceptDonation,
  completeDonation,
  cancelDonation,
  getMyDonations,
  getDonationHistory,
};
