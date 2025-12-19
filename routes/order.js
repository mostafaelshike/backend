const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken, verifyTokenAndAdmin } = require('../middleware/auth');

// Helper لتنظيف مسار الصورة
const cleanImagePath = (path) => {
  if (!path) return '';
  return path.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
};

// ==================== USER ROUTES ====================

// GET /api/orders/my/current → جلب السلة الحالية
router.get('/my/current', verifyToken, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ user: req.user.id, status: 'pending' })
    .populate('items.productId', 'name price images')
    .lean();

  if (order) {
    order.items = order.items.map(item => ({
      ...item,
      image: item.productId?.images?.[0] ? `/uploads/${item.productId.images[0].split('/').pop()}` : ''
    }));
  }

  res.json(order || { items: [], total: 0 });
}));

// POST /api/orders/add-to-cart → إضافة منتج للسلة
router.post('/add-to-cart', verifyToken, asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size = '' } = req.body;

  if (!productId) return res.status(400).json({ message: 'Product ID is required' });

  const dbProduct = await Product.findById(productId);
  if (!dbProduct) return res.status(404).json({ message: 'Product not found' });
  if (!dbProduct.inStock) return res.status(400).json({ message: 'Product out of stock' });

  let order = await Order.findOne({ user: req.user.id, status: 'pending' });

  if (!order) {
    order = new Order({
      user: req.user.id,
      items: [],
      total: 0,
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Cart created' }]
    });
  }

  const existingItemIndex = order.items.findIndex(
    item => item.productId.toString() === productId && item.size === size
  );

  if (existingItemIndex > -1) {
    order.items[existingItemIndex].quantity += quantity;
  } else {
    order.items.push({
      productId: dbProduct._id,
      name: dbProduct.name,
      price: dbProduct.price,
      quantity,
      size,
      image: dbProduct.images?.[0] ? `/uploads/${dbProduct.images[0].split('/').pop()}` : ''
    });
  }

  order.total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('items.productId', 'name price images');
  res.json({ success: true, message: 'تم إضافة المنتج للسلة', order: populatedOrder });
}));

// PUT /api/orders/my/current → تحديث الكميات أو الحذف من السلة
router.put('/my/current', verifyToken, asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, quantity, size }]

  let order = await Order.findOne({ user: req.user.id, status: 'pending' });
  if (!order) return res.status(404).json({ message: 'لا توجد سلة حالية' });

  order.items = [];
  for (const item of items) {
    if (item.quantity <= 0) continue;

    const dbProduct = await Product.findById(item.productId);
    if (!dbProduct) continue;

    order.items.push({
      productId: dbProduct._id,
      name: dbProduct.name,
      price: dbProduct.price,
      quantity: item.quantity,
      size: item.size || '',
      image: dbProduct.images?.[0] ? `/uploads/${dbProduct.images[0].split('/').pop()}` : ''
    });
  }

  order.total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await order.save();

  res.json({ success: true, message: 'تم تحديث السلة', order });
}));

// PUT /api/orders/:orderId/confirm → تأكيد الطلب
router.put('/:orderId/confirm', verifyToken, asyncHandler(async (req, res) => {
  const { fullName, phone, city, street, country, paymentMethod, notes } = req.body;
  const { orderId } = req.params;

  if (!fullName || !phone || !city || !street || !country || !paymentMethod) {
    return res.status(400).json({ message: 'جميع بيانات الشحن مطلوبة' });
  }

  const order = await Order.findById(orderId);
  if (!order || order.user.toString() !== req.user.id) return res.status(403).json({ message: 'غير مصرح' });
  if (order.status !== 'pending') return res.status(400).json({ message: 'الطلب تم تأكيده مسبقًا' });

  order.shippingAddress = { fullName, phone, city, street, country };
  order.payment = { method: paymentMethod };
  order.notes = notes || '';
  order.status = 'processing';
  order.statusHistory.push({ status: 'processing', note: 'تم تأكيد الطلب من العميل' });

  await order.save();
  res.json({ success: true, message: 'تم تأكيد الطلب بنجاح', order });
}));

// GET /api/orders/my → جلب طلبات المستخدم
router.get('/my', verifyToken, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate('items.productId', 'name price images');
  res.json({ success: true, orders });
}));

// ==================== ADMIN ROUTES ====================

// GET /api/orders → كل الطلبات (أدمن)
router.get('/', verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'firstname lastname email')
    .populate('items.productId', 'name price images')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
}));

// GET /api/orders/:id/admin → تفاصيل طلب معين (أدمن)
router.get('/:id/admin', verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstname lastname email')
    .populate('items.productId', 'name price images stock');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ success: true, order });
}));

// PUT /api/orders/:id/admin → تعديل الطلب من الأدمن (حالة، ملاحظات، إلخ)
router.put('/:id/admin', verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const { status, adminNote, shippingPrice = 0 } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (status && ['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    if (order.status !== status) {
      order.status = status;
      order.statusHistory.push({ status, note: adminNote || `تم تغيير الحالة إلى ${status}` });
    }
  }

  order.total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0) + parseFloat(shippingPrice);
  await order.save();

  const populated = await Order.findById(order._id)
    .populate('user', 'firstname lastname email')
    .populate('items.productId', 'name price images');

  res.json({ success: true, message: 'تم تحديث الطلب', order: populated });
}));

module.exports = router;