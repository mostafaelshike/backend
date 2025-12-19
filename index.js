const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

/* ===== CORS (الإعداد النهائي والأكثر أماناً لحل خطأ 0) ===== */
const corsOptions = {
  origin: [
    'https://frontend-production-0f4f.up.railway.app', // رابط الفرونت اند
    'http://localhost:4200'                           // للتجربة المحلية
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200 // لضمان استجابة المتصفحات القديمة
};

app.use(cors(corsOptions));

// حاسم جداً: الرد على طلبات التمهيد (Preflight) التي يرسلها المتصفح تلقائياً
// بديل آخر يعمل أيضاً:
app.use(cors(corsOptions)); // هذا كافٍ للتعامل مع الـ OPTIONS لمعظم الحالات

/* ===== Middleware ===== */
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ===== Routes ===== */
app.get('/', (req, res) => {
  res.send('Backend is live and running on Railway 🚀');
});

app.use('/api/products', require('./routes/product'));
app.use('/api/users', require('./routes/user'));
app.use('/api/orders', require('./routes/order'));

/* ===== Errors ===== */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ===== MongoDB ===== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected to MECAL ✅'))
  .catch(err => console.error('MongoDB Connection Error:', err));

/* ===== Start Server ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} 🚀`);
});