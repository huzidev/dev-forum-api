const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Add request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
    res.json({ status: 'OK', message: 'Forum API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
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

// Wrap the app for serverless with error handling
const handler = serverless(app, {
    request: (request, event, context) => {
        console.log('Serverless request:', { 
            url: request.url, 
            method: request.method,
            headers: request.headers 
        });
    },
    response: (response, event, context) => {
        console.log('Serverless response:', { 
            statusCode: response.statusCode 
        });
    }
});

// Export as serverless function
module.exports = handler;
module.exports.handler = handler;
