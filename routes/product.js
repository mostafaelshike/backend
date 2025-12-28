const express = require("express");
const router = express.Router();
const multer = require("multer");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;

// إعداد Cloudinary من المتغيرات البيئية
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer في الذاكرة فقط (مش هيكتب على القرص)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("الملف يجب أن يكون صورة!"), false);
  },
});

// دالة رفع الصورة إلى Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "mecal_products", // مجلد منظم في Cloudinary (اختياري)
        transformation: [
          { width: 800, height: 800, crop: "limit" }, // تحجيم آمن
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    ).end(file.buffer);
  });
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
      req.files.map(file => uploadToCloudinary(file))
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
    req.files.map(file => uploadToCloudinary(file))
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