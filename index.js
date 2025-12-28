const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// تحميل المتغيرات من .env
dotenv.config();

const app = express();

// ✅ قائمة الدومينات المسموح بها
const allowedOrigins = [
    'https://frontend-production-488e.up.railway.app',
    'https://frontend-production-57259.up.railway.app',
    'http://localhost:4200',        // Angular محلي
    'http://localhost:3000',        // React محلي
    'https://your-production-domain.com' // دومينك النهائي لما تشتريه
];

// ✅ إعدادات CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// دعم preflight لكل الروابط
app.options('*', cors());

// ✅ معالجة البيانات
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ✅ خدمة الصور المحلية من مجلد uploads (التعديل المهم جدًا)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ مسار اختباري
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Backend is Live with Local Image Uploads! 🚀",
        images: "Images are now served from /uploads folder locally",
        note: "No more Uploadcare trial deletion issues!"
    });
});

// ✅ روابط API
app.use('/api/products', require('./routes/product'));
app.use('/api/users', require('./routes/user'));
app.use('/api/orders', require('./routes/order'));

// إعدادات Port و MongoDB
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined!");
    process.exit(1);
}

// ✅ الاتصال بـ MongoDB وتشغيل السيرفر
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌍 Access it at: http://localhost:${PORT}`);
            console.log(`🖼️  Images served at: http://localhost:${PORT}/uploads/your-image.jpg`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// ✅ معالجة الأخطاء العامة
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS policy: Origin not allowed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});