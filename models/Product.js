const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  // 🏷️ اسم المنتج
  name: { type: String, required: true, trim: true },

  // 🧾 وصف المنتج
  description: { type: String, required: true },

  // 💰 السعر
  price: { type: Number, required: true, min: 0 },

  // 🖼️ الصور
  images: { type: [String], required: true },

  
  category: { 
    type: String, 
    enum: ["Bandage", "Covid Mask","Feature Product","Injection","Medikit","Mom &baby","Nutraceutical","Personal care","Sanitizer","Stethoscope","Thermometer"], 
    required: true 
  },

 

  // 🏪 حالة المنتج (موجود / غير متوفر)
  inStock: { type: Boolean, default: true },

  // 🕒 تاريخ الإضافة
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", productSchema);
