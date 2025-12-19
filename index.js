const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

/* ===== CORS (لازم أول حاجة) ===== */
app.use(cors({
  origin: 'http://localhost:4200', // أو '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


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
  .catch(err => console.error(err));

/* ===== Start Server ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
