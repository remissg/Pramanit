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

const createAuthTables = async () => {
    const client = await pool.connect();
    try {
        console.log('Connecting to database...');

        await client.query('BEGIN');

        // 1. Users Table
        // Includes 'role' column for potential admin features
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                org_name VARCHAR(255),
                org_logo_url TEXT,
                role VARCHAR(50) DEFAULT 'user',
                plan_type VARCHAR(50) DEFAULT 'free',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Users table created');

        // 2. Designs Table (Fabric.js JSON storage)
        await client.query(`
            CREATE TABLE IF NOT EXISTS designs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                design_json JSONB NOT NULL,
                preview_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Designs table created');

        // 3. Email Templates Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body_html TEXT NOT NULL,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Email Templates table created');

        // 4. Update Verifications to link to Users (optional for now, but good practice)
        // We add the column first, allowing NULLs for existing records
        await client.query(`
            ALTER TABLE verifications 
            ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ Linked Verifications to Users');

        await client.query('COMMIT');
        console.log('🎉 Auth & Design Schema Migration Complete!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

createAuthTables();
