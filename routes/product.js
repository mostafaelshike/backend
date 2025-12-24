const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// ✅ تأمين وجود مجلد الرفع تلقائياً
const uploadDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعدادات التخزين
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"), // تأكد أن المسار مطابق لتعريف static في app.js
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// ---------------------------------------------------------
// 🚀 1. جلب كل المنتجات (هذا هو التعديل المطلوب للعرض)
// ---------------------------------------------------------
router.get("/", asyncHandler(async (req, res) => {
    // جلب المنتجات وترتيبها من الأحدث للأقدم
    const products = await Product.find().sort({ createdAt: -1 });
    
    // إرسال البيانات بنفس الهيكل الذي يتوقعه الأنجولار (res.products)
    res.status(200).json({
        success: true,
        products: products
    });
}));

// ---------------------------------------------------------
// 🚀 2. إنشاء منتج جديد (معدل لضمان الدقة)
// ---------------------------------------------------------
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock, sectionType } = req.body;

    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "البيانات ناقصة" });
    }

    const images = req.files?.map(file => `/uploads/${file.filename}`) || [];

    if (images.length === 0) {
        return res.status(400).json({ message: "يجب رفع صورة واحدة على الأقل" });
    }

    const product = new Product({
        name,
        description,
        price: Number(price),
        category,
        sectionType: sectionType || category,
        images: images,
        inStock: inStock === 'true' || inStock === true,
    });

    await product.save();
    res.status(201).json({ success: true, message: "تم إنشاء المنتج بنجاح", product });
}));

// ---------------------------------------------------------
// 🚀 3. جلب منتج واحد (للتعديل)
// ---------------------------------------------------------
router.get("/:id", asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.status(200).json({ success: true, product });
}));

// ---------------------------------------------------------
// 🚀 4. حذف منتج
// ---------------------------------------------------------
router.delete("/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.status(200).json({ success: true, message: "تم حذف المنتج بنجاح" });
}));

module.exports = router;