const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      size: { type: String },
      image: { type: String }
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
  createdAt: { type: Date, default: Date.now },

  shippingAddress: {
    fullName: { type: String },  // مؤقتًا يمكن تركها فارغة للسلة
    phone: { type: String },
    city: { type: String },
    street: { type: String },
    country: { type: String }
  },
  payment: {
    method: { type: String, enum: ['cash', 'card'] } // مؤقتًا يمكن تركها فارغة للسلة
  },
  notes: { type: String },
  statusHistory: [
    {
      status: { type: String, required: true },
      at: { type: Date, default: Date.now },
      note: { type: String }
    }
  ]
});

module.exports = mongoose.model('Order', orderSchema);
