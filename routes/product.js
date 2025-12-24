const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// ✅ تأمين وجود مجلد الرفع
const uploadDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعدادات multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// 🚀 1. جلب كل المنتجات
router.get("/", asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products: products });
}));

// 🚀 2. جلب منتج واحد
router.get("/:id", asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.status(200).json({ success: true, product });
}));

// 🚀 3. تحديث منتج موجود
router.put("/:id", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock, sectionType, existingImages } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    let updatedImages = [];
    if (existingImages) {
        updatedImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    }

    if (req.files && req.files.length > 0) {
        // ✅ تحسين: تحويل أي Backslash إلى Forward Slash لضمان ظهور الصور على الويب
        const newImages = req.files.map(file => {
            const imagePath = `/uploads/${file.filename}`;
            return imagePath.replace(/\\/g, '/'); 
        });
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

// 🚀 4. إنشاء منتج جديد
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock, sectionType } = req.body;
    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "البيانات ناقصة" });
    }

    // ✅ تحسين: التأكد من صيغة المسار عند الحفظ لأول مرة
    const images = req.files?.map(file => {
        const imagePath = `/uploads/${file.filename}`;
        return imagePath.replace(/\\/g, '/');
    }) || [];

    const product = new Product({
        name, description, price: Number(price), category,
        sectionType: sectionType || category,
        images, inStock: inStock === 'true' || inStock === true,
    });

    await product.save();
    res.status(201).json({ success: true, message: "تم إنشاء المنتج بنجاح", product });
}));

// 🚀 5. حذف منتج
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.status(200).json({ success: true, message: "تم حذف المنتج بنجاح" });
}));

module.exports = router;