const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

// Ideally move to .env
const JWT_SECRET = process.env.JWT_SECRET || 'certiflow-secure-secret-key-2024';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const signup = async (req, res) => {
    const { email, password, orgName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if user exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            `INSERT INTO users (email, password_hash, org_name, role) 
             VALUES ($1, $2, $3, 'user') RETURNING id, email, org_name, role, created_at`,
            [email, hashedPassword, orgName || '']
        );

        const user = newUser.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                orgName: user.org_name,
                role: user.role
            },
            token
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                orgName: user.org_name,
                role: user.role,
                orgLogo: user.org_logo_url,
                planType: user.plan_type
            },
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getProfile = async (req, res) => {
    try {
        // req.user is set by middleware
        const result = await db.query('SELECT id, email, org_name, org_logo_url, role, plan_type FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    signup,
    login,
    getProfile
};
