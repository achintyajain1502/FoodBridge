-- Food Donation Platform — Database Schema (Version 1)

DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE donation_status AS ENUM ('available', 'accepted', 'completed', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL,
    phone           VARCHAR(20),
    address         VARCHAR(255),
    city            VARCHAR(100),
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
    id              SERIAL PRIMARY KEY,
    donor_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ngo_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
    food_type       VARCHAR(150) NOT NULL,
    quantity        NUMERIC(10, 2) NOT NULL,
    unit            VARCHAR(30) NOT NULL DEFAULT 'kg',
    description     TEXT,
    pickup_address  VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    expiry_time     TIMESTAMP NOT NULL,
    status          donation_status NOT NULL DEFAULT 'available',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMP,
    completed_at    TIMESTAMP
);

-- Audit trail for status changes (useful for "donation history" screens)
CREATE TABLE IF NOT EXISTS donation_status_log (
    id              SERIAL PRIMARY KEY,
    donation_id     INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    status          donation_status NOT NULL,
    changed_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    note            VARCHAR(255),
    changed_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_status_city ON donations(status, city);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo ON donations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
