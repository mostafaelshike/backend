const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS المحسن (أفضل أمانًا)
app.use(cors({
    origin: 'https://frontswiper-production.up.railway.app', // غيرها لدومينك الفعلي
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // لو بتستخدم cookies أو tokens
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route للاختبار
app.get('/', (req, res) => {
    res.status(200).send("Backend is Live and CORS is Fixed! 🚀");
});

// Routes
app.use('/api/users', require('./routes/user')); // تأكد إن /register موجود هنا

// Global error handler (اختياري لكن مفيد)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1); // خروج لو الـ DB فشل
    });