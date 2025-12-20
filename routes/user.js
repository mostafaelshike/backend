const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// تسجيل مستخدم جديد
router.post('/register', asyncHandler(async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // تأكد من وصول البيانات (للتصحيح فقط)
  console.log("Registering user:", email);

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
  }

  const user = await User.create({
    firstname,
    lastname,
    email,
    password,
  });

  // تأكد من وجود JWT_SECRET أو استخدم قيمة افتراضية لكي لا يتوقف السيرفر
  const secret = process.env.JWT_SECRET || 'my_backup_secret_123';
  const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    message: 'تم التسجيل بنجاح',
    token,
    user: {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    }
  });
}));

// تسجيل الدخول
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  
  // تأكد أن ميثود comparePassword موجودة في موديل User
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  const secret = process.env.JWT_SECRET || 'my_backup_secret_123';
  const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    }
  });
}));

module.exports = router;