const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env from two levels up (server root)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Connecting to database...');
        await client.query('BEGIN');

        console.log('Adding columns to users table...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS designation VARCHAR(255),
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
        `);

        await client.query('COMMIT');
        console.log('✅ Migration successful: Added full_name, designation, is_verified, and verification_token columns.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

migrate();
