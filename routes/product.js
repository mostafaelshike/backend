const express = require("express");
const router = express.Router();
const multer = require("multer");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// إعداد multer للذاكرة
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB حد أقصى للصورة
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("الملف يجب أن يكون صورة!"), false);
  },
});

// دالة رفع الصور إلى Uploadcare مع رابط عرض صحيح 100%
// دالة رفع الصور إلى Uploadcare مع رابط عرض مضمون ومحسن جدًا
const uploadToUploadcare = async (fileBuffer, originalName) => {
  const uploadcare = require("@uploadcare/upload-client");

  const result = await uploadcare.uploadFile(fileBuffer, {
    publicKey: process.env.UPLOADCARE_PUBLIC_KEY,
    fileName: originalName,
    store: "1", // تخزين دائم (مهم عشان الصور متتحذفش)
  });

  // الرابط الأمثل والمضمون: preview + تحسين صيغة وجودة
  // -/preview/ يضمن عرض الصورة فورًا مهما كانت الصيغة
  return `https://ucarecdn.com/${result.uuid}/-/preview/-/format/auto/-/quality/smart/`;

  // لو عايز thumbnails أصغر (مثالي للعرض في الصفحات):
  // return `https://ucarecdn.com/${result.uuid}/-/preview/800x800/-/format/auto/-/quality/smart/`;
};

// جلب كل المنتجات
router.get("/", asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, products });
}));

// جلب منتج واحد
router.get("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
  res.status(200).json({ success: true, product });
}));

// تحديث منتج
router.put("/:id", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const { name, description, price, category, inStock, sectionType, existingImages } = req.body;

  let product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

  let updatedImages = existingImages 
    ? (typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages) 
    : [];

  if (req.files && req.files.length > 0) {
    const newImages = await Promise.all(
      req.files.map(file => uploadToUploadcare(file.buffer, file.originalname))
    );
    updatedImages = [...updatedImages, ...newImages];
  }

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

// إنشاء منتج جديد
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
  const { name, description, price, category, inStock, sectionType } = req.body;

  if (!name || !description || !price || !category) 
    return res.status(400).json({ message: "البيانات ناقصة" });

  if (!req.files || req.files.length === 0) 
    return res.status(400).json({ message: "يجب رفع صورة واحدة على الأقل" });

  const images = await Promise.all(
    req.files.map(file => uploadToUploadcare(file.buffer, file.originalname))
  );

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

// حذف منتج
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
  res.status(200).json({ success: true, message: "تم حذف المنتج بنجاح" });
}));

module.exports = router;