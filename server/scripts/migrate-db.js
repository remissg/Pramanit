const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const createVerificationsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Connecting to database...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS verifications (
                cert_id VARCHAR(255) PRIMARY KEY,
                recipient_name VARCHAR(255),
                recipient_email VARCHAR(255),
                issuer_name VARCHAR(255),
                issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                data_hash VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                scan_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Verifications table created successfully');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

createVerificationsTable();
