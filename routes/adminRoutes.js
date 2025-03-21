const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isLoggedIn, preventSelfAction } = require("../middlewares/authMiddleware");

// Route quản trị
router.get("/", isLoggedIn, adminController.getAdminPage);

// Thêm người dùng
router.post("/add", isLoggedIn, adminController.addUser);

// Phân quyền người dùng (ngăn thao tác với chính mình)
router.post("/role/:id", [isLoggedIn, preventSelfAction], adminController.assignRole);

// Sửa thông tin người dùng
router.get("/edit/:id", [isLoggedIn, preventSelfAction], adminController.editUser);
router.post("/edit/:id", [isLoggedIn, preventSelfAction], adminController.updateUser);

// Xóa người dùng (ngăn thao tác với chính mình)
router.get("/delete/:id", [isLoggedIn, preventSelfAction], adminController.deleteUser);

module.exports = router;
