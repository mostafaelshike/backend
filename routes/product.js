const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// إعداد Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("صور فقط (jpeg, jpg, png, webp)"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 5 } }); // 5MB max

// إنشاء منتج جديد
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const { name, description, price, category, inStock } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({ message: "جميع الحقول الأساسية مطلوبة" });
  }

  const images = req.files?.map(file => `/uploads/${file.filename}`) || [];

  const product = new Product({
    name,
    description,
    price: Number(price),
    category,
    images,
    inStock: inStock === 'true' || inStock === true,
  });

  await product.save();
  res.status(201).json({ success: true, message: "تم إنشاء المنتج بنجاح", product });
}));

// تعديل منتج
router.put("/:id", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

  const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
  const newImages = req.files?.map(file => `/uploads/${file.filename}`) || [];

  product.name = req.body.name || product.name;
  product.description = req.body.description || product.description;
  product.price = req.body.price ? Number(req.body.price) : product.price;
  product.category = req.body.category || product.category;
  product.images = [...existingImages, ...newImages];
  product.inStock = req.body.inStock !== undefined ? req.body.inStock === 'true' : product.inStock;

  await product.save();
  res.json({ success: true, message: "تم تحديث المنتج بنجاح", product });
}));

// حذف منتج
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
  res.json({ success: true, message: "تم حذف المنتج بنجاح" });
}));

// جلب كل المنتجات (مع فلترة حسب category)
router.get("/", asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, products });
}));

// جلب منتج واحد
router.get("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
  res.json({ success: true, product });
}));

module.exports = router;