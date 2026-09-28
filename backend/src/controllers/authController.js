const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const VALID_ROLES = ['donor', 'ngo'];

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role, phone, address, city } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, address, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, phone, address, city, is_verified, created_at`,
      [name, email, passwordHash, role, phone || null, address || null, city || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    delete user.password_hash;

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, address, city, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        message: 'If an account exists with this email, a reset link has been created.'
      });
    }

    const { BREVO_API_KEY, BREVO_SENDER_EMAIL } = process.env;
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, '');

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !frontendUrl) {
      throw new Error('Brevo email settings are missing in backend/.env');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `UPDATE users
       SET reset_token = $1,
           reset_token_expires_at = NOW() + INTERVAL '15 minutes'
       WHERE id = $2`,
      [resetToken, result.rows[0].id]
    );

    const resetUrl =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          email: BREVO_SENDER_EMAIL,
          name: process.env.BREVO_SENDER_NAME || 'FoodBridge'
        },
        to: [{ email }],
        subject: 'FoodBridge Password Reset',
        htmlContent: `
          <h2>Reset your FoodBridge password</h2>
          <p>You requested a password reset.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>This link expires in 15 minutes.</p>
        `
      })
    });

    if (!brevoResponse.ok) {
      throw new Error(`Brevo failed: ${await brevoResponse.text()}`);
    }

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Password-reset email error:', err.message);
    res.status(500).json({ error: 'Could not send reset email' });
  }
}
// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    const result = await pool.query(
      `SELECT id
       FROM users
       WHERE reset_token = $1
       AND reset_token_expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires_at = NULL
       WHERE id = $2`,
      [passwordHash, result.rows[0].id]
    );

    res.json({
      message: 'Password reset successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Something went wrong'
    });
  }
}
module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword
};
