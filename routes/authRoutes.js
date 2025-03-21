const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isLoggedIn } = require("../middlewares/authMiddleware");
// Utility function for fetching flash messages
const getFlashMessages = (req) => ({
  errorMessage: req.flash('error')[0] || '',
  successMessage: req.flash('success')[0] || '',
});

// Trang quản trị
router.get('/admin', authController.getAdminPage);

// Hiển thị form đăng nhập
router.get("/login", (req, res) => {
  res.render("login", { errorMessage: req.flash("errorMessage"), successMessage: req.flash("successMessage") });
});

router.get("/register", (req, res) => {
  res.render("register", { errorMessage: req.flash("errorMessage"), successMessage: req.flash("successMessage") });
});

// Xử lý đăng nhập
router.post("/login", authController.postLogin);


// Xử lý đăng ký
router.post("/register", authController.postRegister);

// Xử lý đăng xuất
router.get('/logout', authController.logout);

// Chức năng chỉnh sửa người dùng
router.get('/admin/edit/:id', authController.editUser); // Hiển thị form chỉnh sửa
router.post('/admin/edit/:id', authController.updateUser); // Cập nhật thông tin người dùng

// Chức năng xóa người dùng
router.get('/admin/delete/:id', authController.deleteUser); // Xóa người dùng

// Thêm người dùng mới
router.post('/admin/add', authController.addUser);  // Xử lý thêm tài khoản

// Phân quyền người dùng
router.post('/admin/role/:id', authController.assignRole);  // Cập nhật vai trò

module.exports = router;
