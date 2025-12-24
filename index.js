const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // إضافة مكتبة المسارات
const fs = require('fs');     // إضافة مكتبة نظام الملفات

// تحميل الإعدادات
dotenv.config();

const app = express();

// ✅ تأمين وجود مجلد الرفع (Uploads) لضمان عدم حدوث خطأ 500 عند رفع الصور
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 1. إعدادات CORS
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ 2. معالجة JSON والبيانات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 3. جعل مجلد الصور متاحاً للمتصفح (Static Folder)
// هذا السطر هو المسؤول عن جعل روابط الصور مثل /uploads/image.jpg تعمل
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ 4. مسار اختباري
app.get('/', (req, res) => {
    res.status(200).send("Backend is Live, Static Files are ready! 🚀");
});

// ✅ 5. الروابط (Routes)
app.use('/api/products', require('./routes/product'));
app.use('/api/users', require('./routes/user'));
app.use('/api/orders', require('./routes/order'));

// ✅ 6. إعدادات الـ Port و الـ URI
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// ✅ 7. الاتصال بقاعدة البيانات والتشغيل
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