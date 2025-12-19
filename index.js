const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

/* ===== إعدادات CORS المضمونة والآمنة ===== */
app.use(cors({
  origin: function (origin, callback) {
    // السماح بالطلبات بدون origin (مثل Postman أو mobile apps)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:4200',                    // Development محلي
      'http://localhost:3000',                    // لو بتستخدم React أو غيره
      'https://frontend-production-0f4f.up.railway.app', // Frontend Production (غيّره لو اتغير)
      // أضف أي domain تاني هنا لو عايز
    ];

    // السماح لو الـ origin موجود في القائمة أو من Railway نفسه (للـ production)
    if (allowedOrigins.includes(origin) || origin.includes('railway.app')) {
      callback(null, true);
    } else {
      console.log('❌ CORS Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // ضروري للـ Authorization headers و cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

/* ===== Middleware الأساسي ===== */
app.use(express.json({ limit: '10mb' })); // لدعم رفع الصور الكبيرة
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ===== الروت الرئيسي ===== */
app.get('/', (req, res) => {
  res.send('MECAL Backend is Live - CORS Fixed & MongoDB Connected 🚀');
});

/* ===== الروتس ===== */
app.use('/api/products', require('./routes/product'));
app.use('/api/users', require('./routes/user'));
app.use('/api/orders', require('./routes/order'));

/* ===== معالجة الروت غير موجود ===== */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ===== معالجة الأخطاء العامة (اختياري للـ debugging) ===== */
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ success: false, message: 'Server Error' });
});

/* ===== الاتصال بـ MongoDB ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected to MECAL ✅'))
  .catch(err => console.error('MongoDB Error ❌:', err));

/* ===== تشغيل السيرفر ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (host: 0.0.0.0)`);
});