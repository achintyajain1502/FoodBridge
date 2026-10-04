const express = require('express');
const pool = require('./config/db');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin');


async function ensureCertificateColumn() {
  try {
    await pool.query(`
      ALTER TABLE donations
      ADD COLUMN IF NOT EXISTS certificate_allowed BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('✅ Certificate permission column ready.');
  } catch (err) {
    console.error('❌ Could not prepare certificate permission column:', err.message);
    process.exit(1);
  }
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Central error handler (catches anything thrown synchronously in routes)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await ensureCertificateColumn();
  const server = app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`FoodBridge API cannot start: port ${PORT} is already in use. Run only the root "npm run dev" command.`);
    } else {
      console.error('FoodBridge API failed to start:', err.message);
    }
    process.exit(1);
  });
}

startServer();
