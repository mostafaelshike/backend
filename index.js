const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// تحميل الإعدادات
dotenv.config();

const app = express();

// ✅ 1. إعدادات CORS (يجب أن تكون أول شيء)
app.use(cors({
    origin: '*', // يسمح لجميع المواقع بالوصول (مناسب للمرحلة الحالية)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ 2. معالجة JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 3. مسار اختباري
app.get('/', (req, res) => {
    res.status(200).send("Backend is Live and CORS is Fixed! 🚀");
});

// ✅ 4. الروابط (Routes) - تم تصحيح الفواصل هنا
app.use('/api/products', require('./routes/product'));
app.use('/api/users', require('./routes/user'));
app.use('/api/orders', require('./routes/order'));

// ✅ 5. إعدادات الـ Port و الـ URI
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// ✅ 6. الاتصال بقاعدة البيانات والتشغيل
if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined in environment variables!");
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });