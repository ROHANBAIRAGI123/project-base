import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('Welcome to the Express.js server!');
});

export default app;