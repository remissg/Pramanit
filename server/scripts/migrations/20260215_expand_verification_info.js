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

        console.log('Adding organization and designation columns to verifications table...');

        await client.query(`
            ALTER TABLE verifications 
            ADD COLUMN IF NOT EXISTS org_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS issuer_designation VARCHAR(255);
        `);

        await client.query('COMMIT');
        console.log('✅ Migration successful: Added org_name and issuer_designation columns to verifications.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

migrate();
