const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

const userRouter = require('./routes/user.router');
const authRouter = require('./routes/auth.router');
const bugRouter = require('./routes/bug.router');
const friendRouter = require('./routes/friend.router');
const notificationRouter = require('./routes/notification.router');
const planRouter = require('./routes/plan.router');
const pointsRouter = require('./routes/points.router');
const postRouter = require('./routes/post.router');
const questionRouter = require('./routes/question.router');

// CORS setup
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dev-forum-admin.vercel.app",
        "https://dev-forum-main.vercel.app",
    ],
    credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/friends', friendRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/plans', planRouter);
app.use('/api/points', pointsRouter);
app.use('/api/posts', postRouter);
app.use('/api/questions', questionRouter);

// Root route
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Dev Forum API is running',
        endpoints: {
            health: '/api/health',
        },
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Forum API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack || err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Local development support (optional)
const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = serverless(app);
