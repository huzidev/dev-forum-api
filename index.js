const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Add request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    next();
});

// Import all routers (adjusted paths for api/ folder)
let userRouter, authRouter, bugRouter, friendRouter, notificationRouter, planRouter, pointsRouter, postRouter, questionRouter;

try {
    userRouter = require('./routes/user.router');
    authRouter = require('./routes/auth.router');
    bugRouter = require('./routes/bug.router');
    friendRouter = require('./routes/friend.router');
    notificationRouter = require('./routes/notification.router');
    planRouter = require('./routes/plan.router');
    pointsRouter = require('./routes/points.router');
    postRouter = require('./routes/post.router');
    questionRouter = require('./routes/question.router');
} catch (error) {
    console.error('Error importing routers:', error);
    // Create fallback routers if imports fail
    const express = require('express');
    const fallbackRouter = express.Router();
    fallbackRouter.use((req, res) => {
        res.status(503).json({ error: 'Service temporarily unavailable' });
    });
    
    userRouter = authRouter = bugRouter = friendRouter = notificationRouter = 
    planRouter = pointsRouter = postRouter = questionRouter = fallbackRouter;
}

// CORS middleware
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://dev-forum-admin.vercel.app",
            "https://dev-forum-main.vercel.app"
        ],
        credentials: true,
    })
);

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes with /api prefix
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/friends', friendRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/plans', planRouter);
app.use('/api/points', pointsRouter);
app.use('/api/posts', postRouter);
app.use('/api/questions', questionRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('Health check endpoint hit');
    try {
        res.status(200).json({ 
            status: 'OK', 
            message: 'Forum API is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown'
        });
    } catch (error) {
        console.error('Error in health check:', error);
        res.status(500).json({ error: 'Health check failed' });
    }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.status(200).send('Test endpoint working');
});

// Root endpoint for debugging
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Forum API Root - Use /api/health for health check',
        availableRoutes: [
            '/api/health',
            '/api/users',
            '/api/auth',
            '/api/bugs',
            '/api/friends',
            '/api/notifications',
            '/api/plans',
            '/api/points',
            '/api/posts',
            '/api/questions'
        ]
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'Endpoint not found',
        method: req.method,
        url: req.url,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'POST /api/auth/*',
            'GET /api/users/*',
            'GET /api/bugs/*',
            'GET /api/friends/*',
            'GET /api/notifications/*',
            'GET /api/plans/*',
            'GET /api/points/*',
            'GET /api/posts/*',
            'GET /api/questions/*'
        ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    });
    res.status(500).json({ 
        error: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

// Wrap the app for serverless
const handler = serverless(app, {
    binary: false
});

// Export as serverless function
module.exports = handler;

// Also export the app for local testing
module.exports.app = app;
