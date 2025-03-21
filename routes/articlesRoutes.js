const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const articleController = require('../controllers/articleController');
const savedNewsController = require('../controllers/savedNewsController');

const router = express.Router();

// Route tạo bài viết
router.post('/create', articleController.addArticle);

// Route hiển thị danh sách bài viết
router.get('/', articleController.listArticles);

// Route xem chi tiết bài viết
router.get('/:id', articleController.showArticle);

// Route lưu bài viết
router.post('/save', authMiddleware.isLoggedIn, articleController.saveNews);

// Xóa bài viết đã lưu
router.delete("/delete/:id", savedNewsController.deleteSavedNews);

// Route xem bài viết đã lưu
router.get('/saved', authMiddleware.isLoggedIn, articleController.viewSavedArticles);

module.exports = router;
