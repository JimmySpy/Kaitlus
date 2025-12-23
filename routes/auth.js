const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    res.render('login', { error: null, success: null });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Handle registration
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        return res.render('register', { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.render('register', { error: 'Passwords do not match' });
    }

    if (password.length < 6) {
        return res.render('register', { error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.render('register', { error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.render('login', { error: null, success: 'Account created successfully! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'An error occurred. Please try again.' });
    }
});

// Handle login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', { error: 'All fields are required', success: null });
    }

    try {
        // Find user by email
        const users = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.render('login', { error: 'Invalid email or password', success: null });
        }

        const user = users[0];

        // Check password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.render('login', { error: 'Invalid email or password', success: null });
        }

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred. Please try again.', success: null });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
