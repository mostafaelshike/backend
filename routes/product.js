const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// 🟢 1. إعدادات Cloudinary (بتقرأ من ملف .env اللي عملناه سوا)
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// 🟢 2. إعداد مخزن Cloudinary بدلاً من diskStorage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "products", // اسم المجلد اللي هيظهر في موقع Cloudinary
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
});

const upload = multer({ storage });

// 🚀 3. جلب كل المنتجات (بدون تغيير)
router.get("/", asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products: products });
}));

// 🚀 4. جلب منتج واحد (بدون تغيير)
router.get("/:id", asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.status(200).json({ success: true, product });
}));

// 🚀 5. تحديث منتج موجود (تم التعديل ليتناسب مع Cloudinary)
router.put("/:id", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock, sectionType, existingImages } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    let updatedImages = [];
    if (existingImages) {
        updatedImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }

    if (req.files && req.files.length > 0) {
        // ✅ هنا بناخد الـ path اللي هو لينك Cloudinary المباشر
        const newImages = req.files.map(file => file.path);
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

// 🚀 6. إنشاء منتج جديد (تم التعديل ليتناسب مع Cloudinary)
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock, sectionType } = req.body;
    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "البيانات ناقصة" });
    }

    // ✅ التعديل السحري: req.files دلوقتى جواها لينكات بتبدأ بـ https://res.cloudinary.com...
    const images = req.files?.map(file => file.path) || [];

    const product = new Product({
        name, 
        description, 
        price: Number(price), 
        category,
        sectionType: sectionType || category,
        images, 
        inStock: inStock === 'true' || inStock === true,
    });

    await product.save();
   res.status(201).json({ success: true, message: "نسخة كلاوديناري شغالة ✅", product });
}));

// 🚀 7. حذف منتج (بدون تغيير)
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.status(200).json({ success: true, message: "تم حذف المنتج بنجاح" });
}));

module.exports = router;