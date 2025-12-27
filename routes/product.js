const express = require("express");
const router = express.Router();
const multer = require("multer");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// 🟢 إعداد multer لتخزين الفايلات في الذاكرة (أفضل أداء للرفع)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB لكل صورة
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("الملف يجب أن يكون صورة فقط!"), false);
    }
  },
});

// 🔥 دالة رفع الصورة على Uploadcare مع تخزين دائم فوري
const uploadToUploadcare = async (fileBuffer, originalName) => {
  const uploadcare = require("@uploadcare/upload-client");

  const result = await uploadcare.uploadFile(fileBuffer, {
    publicKey: process.env.UPLOADCARE_PUBLIC_KEY,
    fileName: originalName,
    store: true, // 🔑 التعديل المهم: true عشان الصورة تتخزن دائمًا ومش تتمسح
  });

  // رابط محسن تلقائيًا لأفضل جودة وسرعة (WebP/AVIF + compression ذكي)
  return `${result.cdnUrl}-/format/auto/-/quality/smart/`;
};

// 🚀 جلب كل المنتجات
router.get("/", asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, products });
}));

// 🚀 جلب منتج واحد
router.get("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
  res.status(200).json({ success: true, product });
}));

// 🚀 تحديث منتج موجود
router.put("/:id", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const { name, description, price, category, inStock, sectionType, existingImages } = req.body;

  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

  // الاحتفاظ بالصور القديمة اللي المستخدم مختار يسيبها
  let updatedImages = [];
  if (existingImages) {
    updatedImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
  }

  // رفع الصور الجديدة (مع تخزين دائم)
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file =>
      uploadToUploadcare(file.buffer, file.originalname)
    );
    const newImages = await Promise.all(uploadPromises);
    updatedImages = [...updatedImages, ...newImages];
  }

  // تحديث الحقول الأخرى
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price ? Number(price) : product.price;
  product.category = category || product.category;
  product.sectionType = sectionType || product.sectionType;
  product.inStock = inStock === 'true' || inStock === true;
  product.images = updatedImages;

  await product.save();
  res.status(200).json({ success: true, message: "تم تحديث المنتج بنجاح", product });
}));

// 🚀 إنشاء منتج جديد
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const { name, description, price, category, inStock, sectionType } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({ message: "البيانات ناقصة" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "يجب رفع صورة واحدة على الأقل" });
  }

  // رفع كل الصور مع تخزين دائم
  const uploadPromises = req.files.map(file =>
    uploadToUploadcare(file.buffer, file.originalname)
  );

  const images = await Promise.all(uploadPromises);

  const product = new Product({
    name,
    description,
    price: Number(price),
    category,
    sectionType: sectionType || category,
    inStock: inStock === 'true' || inStock === true,
    images,
  });

  await product.save();
  res.status(201).json({ success: true, message: "تم إنشاء المنتج بنجاح", product });
}));

// 🚀 حذف منتج
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
  res.status(200).json({ success: true, message: "تم حذف المنتج بنجاح" });
}));

module.exports = router;