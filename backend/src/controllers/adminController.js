const pool = require('../config/db');

// GET /api/admin/users?role=donor|ngo|admin
async function listUsers(req, res) {
  try {
    const { role } = req.query;
    const params = [];
    let query = `SELECT id, name, email, role, phone, address, city, is_verified, created_at FROM users`;
    if (role) {
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
}

// PATCH /api/admin/users/:id/verify
async function verifyUser(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET is_verified = TRUE WHERE id = $1
       RETURNING id, name, email, role, is_verified`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify user' });
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete user' });
  }
}

// GET /api/admin/donations  (monitor all donations, any status)
async function listAllDonations(req, res) {
  try {
    const { status } = req.query;
    const params = [];
    let query = `
      SELECT d.*, du.name AS donor_name, nu.name AS ngo_name
      FROM donations d
      JOIN users du ON du.id = d.donor_id
      LEFT JOIN users nu ON nu.id = d.ngo_id
    `;
    if (status) {
      params.push(status);
      query += ` WHERE d.status = $${params.length}`;
    }
    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ donations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch donations' });
  }
}

// GET /api/admin/stats  (simple dashboard counters)
async function getStats(req, res) {
  try {
    const [users, donations, byStatus] = await Promise.all([
      pool.query(`SELECT role, COUNT(*) FROM users GROUP BY role`),
      pool.query(`SELECT COUNT(*) FROM donations`),
      pool.query(`SELECT status, COUNT(*) FROM donations GROUP BY status`),
    ]);

    res.json({
      usersByRole: users.rows,
      totalDonations: Number(donations.rows[0].count),
      donationsByStatus: byStatus.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch stats' });
  }
}

module.exports = { listUsers, verifyUser, deleteUser, listAllDonations, getStats };
