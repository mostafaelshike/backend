const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// تحميل الإعدادات
dotenv.config();

const app = express();

// ✅ إعدادات CORS الشاملة
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ معالجة JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ مسار اختباري للتأكد من حالة السيرفر
app.get('/', (req, res) => {
    res.status(200).send("Backend is Live and CORS is Fixed! 🚀");
});

// ✅ الروابط (Routes)

app.use('/api/products',require('./routes/product')),
app.use('/api/users',require('./routes/user')),
app.use('/api/orders',require('./routes/order'))
// ✅ إعدادات الـ Port و الـ URI
// ملاحظة: Railway بيحدد الـ PORT تلقائياً، لو مش موجود هيشتغل على 8080
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// ✅ الاتصال بقاعدة البيانات والتشغيل
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Successfully');
        // ✅ إضافة '0.0.0.0' ضرورية جداً في الاستضافة السحابية
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
    });