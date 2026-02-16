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

        console.log('Adding Org and SMTP fields to users table...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS org_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS org_logo_url TEXT,
            ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'free',
            ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255),
            ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
            ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255),
            ADD COLUMN IF NOT EXISTS smtp_pass TEXT;
        `);

        await client.query('COMMIT');
        console.log('✅ Migration successful: Added Branding and SMTP fields.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

migrate();
