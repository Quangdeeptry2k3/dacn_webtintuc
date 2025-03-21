const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const authMiddleware = require("../middlewares/authMiddleware"); // Middleware kiểm tra đăng nhập
const articleController = require("../controllers/articleController");
const savedNewsController = require("../controllers/savedNewsController");

// Trang chính hiển thị tin tức
router.get("/", newsController.getNews);

// Tuyến đường xử lý các URL dạng /news/details/:id
router.get('/details/:id', newsController.getNewsDetails);

// Trang giới thiệu
router.get("/about", newsController.getAboutPage);

// Trang liên hệ
router.get("/contact", newsController.getContactPage);

// Xem tất cả bài viết từ cơ sở dữ liệu
router.get("/news", newsController.viewAllNews);

// Lưu bài viết
router.post("/save", authMiddleware.isLoggedIn, newsController.saveNews);
// Xóa bài viết đã lưu (liên quan đến tin tức)
router.delete("/saved/:id", savedNewsController.deleteSavedNews);

// Xem bài viết đã lưu
router.get('/saved', authMiddleware.isLoggedIn, newsController.viewSavedArticles);


module.exports = router;
