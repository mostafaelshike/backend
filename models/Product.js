const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  images: { type: [String], required: true }, // سيتم تخزين مسارات الصور هنا
  category: { 
    type: String, 
    enum: ["Bandage", "Covid Mask","Feature Product","Injection","Medikit","Mom &baby","Nutraceutical","Personal care","Sanitizer","Stethoscope","Thermometer"], 
    required: true 
  },
  sectionType: { type: String }, // تم إضافته لضمان عدم حدوث خطأ عند إرساله من الفرونت إند
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);