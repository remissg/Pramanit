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

        console.log('Creating issuance_history table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS issuance_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
                total_sent INTEGER NOT NULL,
                recipient_list_ref TEXT,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Migration successful: Created issuance_history table.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

migrate();
