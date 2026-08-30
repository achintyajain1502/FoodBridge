const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/db');

const demoUsers = [
  {
    name: 'FoodBridge Administrator',
    email: 'admin@foodbridge.local',
    password: 'FoodBridgeAdmin#2026',
    role: 'admin',
    phone: '+91 90000 10001',
    address: 'FoodBridge Community Hub',
    city: 'Pune',
    is_verified: true,
  },
  {
    name: 'Green Leaf Kitchen',
    email: 'donor@foodbridge.local',
    password: 'FoodBridgeDonor#2026',
    role: 'donor',
    phone: '+91 90000 10002',
    address: '18 Market Road',
    city: 'Pune',
    is_verified: true,
  },
  {
    name: 'Udaan Community Kitchen',
    email: 'ngo@foodbridge.local',
    password: 'FoodBridgeNgo#2026',
    role: 'ngo',
    phone: '+91 90000 10003',
    address: '4 Hope Street',
    city: 'Pune',
    is_verified: true,
  },
];

const demoDonations = [
  {
    food_type: 'Fresh vegetable pulao',
    quantity: 18,
    unit: 'kg',
    description: 'Prepared today and packed for same-day pickup. [FoodBridge demo]',
    pickup_address: 'Green Leaf Kitchen, 18 Market Road',
    city: 'Pune',
    status: 'available',
  },
  {
    food_type: 'Dal and chapati meals',
    quantity: 45,
    unit: 'plates',
    description: 'Individually packed vegetarian meals. [FoodBridge demo]',
    pickup_address: 'Green Leaf Kitchen, 18 Market Road',
    city: 'Pune',
    status: 'accepted',
  },
  {
    food_type: 'Fruit boxes',
    quantity: 12,
    unit: 'boxes',
    description: 'Mixed seasonal fruit boxes. [FoodBridge demo]',
    pickup_address: 'Green Leaf Kitchen, 18 Market Road',
    city: 'Pune',
    status: 'completed',
  },
  {
    food_type: 'Packaged sandwiches',
    quantity: 20,
    unit: 'packets',
    description: 'Sealed sandwiches from a morning event. [FoodBridge demo]',
    pickup_address: 'Green Leaf Kitchen, 18 Market Road',
    city: 'Pune',
    status: 'cancelled',
  },
  {
    food_type: 'Rice and vegetable curry',
    quantity: 10,
    unit: 'kg',
    description: 'Demo record showing an expired pickup window. [FoodBridge demo]',
    pickup_address: 'Green Leaf Kitchen, 18 Market Road',
    city: 'Pune',
    status: 'expired',
  },
];

async function upsertUser(user) {
  const passwordHash = await bcrypt.hash(user.password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone, address, city, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       phone = EXCLUDED.phone,
       address = EXCLUDED.address,
       city = EXCLUDED.city,
       is_verified = EXCLUDED.is_verified
     RETURNING id, email, role`,
    [user.name, user.email, passwordHash, user.role, user.phone, user.address, user.city, user.is_verified],
  );
  return result.rows[0];
}

async function seedDemo() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const users = {};
    for (const user of demoUsers) users[user.role] = await upsertUser(user);

    for (const donation of demoDonations) {
      const existing = await client.query(
        'SELECT id FROM donations WHERE description = $1 AND donor_id = $2',
        [donation.description, users.donor.id],
      );
      if (existing.rows.length > 0) continue;

      const expiry = donation.status === 'expired' ? 'NOW() - INTERVAL \'2 days\'' : 'NOW() + INTERVAL \'2 days\'';
      const accepted = ['accepted', 'completed'].includes(donation.status);
      const completed = donation.status === 'completed';
      const result = await client.query(
        `INSERT INTO donations
          (donor_id, ngo_id, food_type, quantity, unit, description, pickup_address, city,
           expiry_time, status, accepted_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${expiry}, $9,
           CASE WHEN $10 THEN NOW() - INTERVAL '4 hours' ELSE NULL END,
           CASE WHEN $11 THEN NOW() - INTERVAL '1 hour' ELSE NULL END)
         RETURNING id`,
        [
          users.donor.id,
          accepted ? users.ngo.id : null,
          donation.food_type,
          donation.quantity,
          donation.unit,
          donation.description,
          donation.pickup_address,
          donation.city,
          donation.status,
          accepted,
          completed,
        ],
      );

      await client.query(
        `INSERT INTO donation_status_log (donation_id, status, changed_by, note)
         VALUES ($1, 'available', $2, 'Demo donation posted')`,
        [result.rows[0].id, users.donor.id],
      );
      if (accepted) {
        await client.query(
          `INSERT INTO donation_status_log (donation_id, status, changed_by, note)
           VALUES ($1, 'accepted', $2, 'Demo NGO accepted donation')`,
          [result.rows[0].id, users.ngo.id],
        );
      }
      if (completed) {
        await client.query(
          `INSERT INTO donation_status_log (donation_id, status, changed_by, note)
           VALUES ($1, 'completed', $2, 'Demo pickup completed')`,
          [result.rows[0].id, users.ngo.id],
        );
      }
      if (donation.status === 'cancelled') {
        await client.query(
          `INSERT INTO donation_status_log (donation_id, status, changed_by, note)
           VALUES ($1, 'cancelled', $2, 'Demo donation cancelled')`,
          [result.rows[0].id, users.donor.id],
        );
      }
      if (donation.status === 'expired') {
        await client.query(
          `INSERT INTO donation_status_log (donation_id, status, changed_by, note)
           VALUES ($1, 'expired', NULL, 'Demo pickup window expired')`,
          [result.rows[0].id],
        );
      }
    }

    await client.query('COMMIT');
    console.log('FoodBridge demo data is ready.');
    console.log('Admin: admin@foodbridge.local / FoodBridgeAdmin#2026');
    console.log('Donor: donor@foodbridge.local / FoodBridgeDonor#2026');
    console.log('NGO: ngo@foodbridge.local / FoodBridgeNgo#2026');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemo().catch((error) => {
  console.error(`Could not seed FoodBridge demo data: ${error.message || error.code}`);
  process.exitCode = 1;
});
