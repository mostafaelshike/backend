const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

/* ===== CORS (الضبط النهائي للربط بين Railway) ===== */
app.use(cors({
  origin: [
    'https://frontend-production-0f4f.up.railway.app', // رابط الفرونت اند بتاعك
    'http://localhost:4200'                           // للسماح لك بالتجربة محلياً أيضاً
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/* ===== Middleware ===== */
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ===== Routes ===== */
app.get('/', (req, res) => {
  res.send('Backend is live and running on Railway 🚀');
});

// تأكد من وجود الملفات دي في فولدر routes عندك
app.use('/api/products', require('./routes/product'));
app.use('/api/users', require('./routes/user'));
app.use('/api/orders', require('./routes/order'));

/* ===== Errors ===== */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ===== MongoDB ===== */
// تأكد أنك أضفت MONGO_URI في تبويب Variables على Railway
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected to MECAL ✅'))
  .catch(err => console.error('MongoDB Connection Error:', err));

/* ===== Start Server ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} 🚀`);
});