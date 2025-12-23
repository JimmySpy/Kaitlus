require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const db = require('./config/database');
const translations = require('./config/translations');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Railway's proxy
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Language middleware
app.use((req, res, next) => {
    const lang = req.cookies.lang || 'en';
    req.lang = lang;
    res.locals.lang = lang;
    res.locals.t = translations[lang] || translations['en'];
    next();
});

// Language switch route
app.get('/lang/:code', (req, res) => {
    const lang = req.params.code;
    if (['en', 'et', 'ru'].includes(lang)) {
        res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
    }
    res.redirect('back');
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

// Home page
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user || null });
});

// Order page
app.get('/order', (req, res) => {
    res.render('order', { user: req.session.user || null, success: null, error: null });
});

app.post('/order', (req, res) => {
    // For now, just show success message
    // TODO: Save order to database
    res.render('order', { 
        user: req.session.user || null, 
        success: res.locals.t.order.success,
        error: null 
    });
});

// Services page
app.get('/services', (req, res) => {
    res.render('services', { user: req.session.user || null });
});

// Sales page
app.get('/sales', (req, res) => {
    res.render('sales', { user: req.session.user || null });
});

// Contact page
app.get('/contact', (req, res) => {
    res.render('contact', { user: req.session.user || null, success: null, error: null });
});

app.post('/contact', (req, res) => {
    // For now, just show success message
    // TODO: Save message to database or send email
    res.render('contact', { 
        user: req.session.user || null, 
        success: res.locals.t.contact.success,
        error: null 
    });
});

// Dashboard (protected route)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('dashboard', { user: req.session.user });
});

// Initialize database and start server
async function startServer() {
    try {
        await db.initializeDatabase();
        console.log('Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Start server anyway for development
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT} (DB not connected)`);
        });
    }
}

startServer();
