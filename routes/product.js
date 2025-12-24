const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { verifyTokenAndAdmin } = require("../middleware/auth");

// ✅ تأمين وجود مجلد الرفع تلقائياً على السيرفر (يمنع خطأ 500)
const uploadDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعدادات التخزين
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// 🚀 إنشاء منتج جديد
router.post("/", verifyTokenAndAdmin, upload.array("images", 5), asyncHandler(async (req, res) => {
    const { name, description, price, category, inStock, sectionType } = req.body;

    // التأكد من الحقول المطلوبة
    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "البيانات ناقصة: الاسم، الوصف، السعر، والقسم مطلوبين." });
    }

    // تجهيز مسارات الصور
    const images = req.files?.map(file => `/uploads/${file.filename}`) || [];

    // التحقق من وجود صور لأن الموديل يطلبها (Required)
    if (images.length === 0) {
        return res.status(400).json({ message: "يجب رفع صورة واحدة على الأقل للمنتج." });
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

    try {
        await product.save();
        res.status(201).json({ success: true, message: "تم إنشاء المنتج بنجاح", product });
    } catch (error) {
        console.error("Mongoose Save Error:", error);
        res.status(500).json({ message: "فشل حفظ المنتج في قاعدة البيانات", error: error.message });
    }
}));

// (باقي المسارات PUT, DELETE, GET تبقى كما هي لديك)
module.exports = router;