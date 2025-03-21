const express = require('express');
const router = express.Router();
const { saveNews, getSavedNewsByUser, deleteSavedNews, viewSavedArticles, viewSavedArticleDetail } = require("../controllers/savedNewsController");
const { isAuthenticated } = require('../middlewares/authMiddleware');
const newsController = require('../controllers/newsController');  // Điều chỉnh đường dẫn nếu cần
const savedNewsController = require('../controllers/savedNewsController'); // Đảm bảo đường dẫn đúng

// Route xem chi tiết bài viết đã lưu
router.get('/savedNews/saved/:id', isAuthenticated, viewSavedArticleDetail);

// Xóa bài viết đã lưu
router.delete('/delete/:id', savedNewsController.deleteSavedNews);
// savedNewsRoutes.js
router.delete('/delete/:id', isAuthenticated, async (req, res) => {
  const newsId = req.params.id;  // Lấy ID bài viết từ URL
  const userId = req.user.id;  // Lấy ID người dùng từ session sau khi xác thực
 // Thêm dòng log để kiểm tra các giá trị
  console.log(`Request to delete article ID: ${newsId}, User ID: ${userId}`);
  try {
    const result = await deleteSavedNews(userId, newsId);  // Gọi hàm xóa bài viết
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bài viết không tìm thấy hoặc không thuộc quyền sở hữu của bạn.' });
    }
    res.status(200).json({ message: 'Bài viết đã được xóa thành công.' });
  } catch (err) {
    console.error('❌ Lỗi khi xóa bài viết:', err);
    res.status(500).json({ error: 'Có lỗi khi xóa bài viết.' });
  }
});


// Route lấy danh sách tin tức đã lưu
router.get('/saved', isAuthenticated, async (req, res) => {
  const userId = req.user.id; // Lấy userId từ session sau khi xác thực
  const page = parseInt(req.query.page) || 1;
  const limit = 9; // Số lượng bài viết mỗi trang
  try {
    const { savedNews, totalPages, currentPage } = await getSavedNewsByUser(userId, page, limit);
    res.render('savedNews', { news: savedNews, totalPages, currentPage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Có lỗi xảy ra khi tải danh sách tin tức đã lưu.' });
  }
});

// Route lưu bài viết
router.post('/save', isAuthenticated, async (req, res) => {
  const { newsId } = req.body;
  const userId = req.user.id; // Dùng userId từ session, đảm bảo đã xác thực người dùng
  if (!userId) {
    return res.status(400).json({ error: "Người dùng không tồn tại." });
  }
  try {
    await saveNews(userId, newsId);
    res.status(200).json({ message: "Tin tức đã được lưu!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Có lỗi xảy ra khi lưu tin tức." });
  }
});

module.exports = router;
