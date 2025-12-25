import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({limit: '16kb'}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Debug middleware - remove in production
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Body:', req.body);
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

import authRoutes from './routers/auth.routes.js';
import healthRoutes from './routers/healthcheck.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/healthcheck', healthRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Express.js server!');
});

// Global error handler - this catches all errors including ApiError
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    if (err.errors && err.errors.length > 0) {
        console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data
        });
    }

    // Handle unexpected errors
    return res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: [],
        data: null
    });
});

export default app;