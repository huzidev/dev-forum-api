const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Import all routers (adjusted paths for api/ folder)
const userRouter = require('./routes/user.router');
const authRouter = require('./routes/auth.router');
const bugRouter = require('./routes/bug.router');
const friendRouter = require('./routes/friend.router');
const notificationRouter = require('./routes/notification.router');
const planRouter = require('./routes/plan.router');
const pointsRouter = require('./routes/points.router');
const postRouter = require('./routes/post.router');
const questionRouter = require('./routes/question.router');

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
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Export as serverless function
module.exports = serverless(app);
