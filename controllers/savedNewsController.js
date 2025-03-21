const News = require('../models/newsModel');

const { SavedNews } = require("../models/savedNewsModel");
const { saveNewsToDB, fetchSavedNewsFromDB, fetchSavedNewsCount, deleteSavedNewsFromDB } = require('../models/savedNewsModel');
const winston = require('winston');

// Lưu bài viết
exports.saveNews = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { newsId } = req.body;

    // Kiểm tra xem bài viết có tồn tại không
    const news = await News.getNewsById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'Bài viết không tồn tại.' });
    }

    // Lưu bài viết vào cơ sở dữ liệu
    await saveNewsToDB(userId, newsId);
    res.status(200).json({ message: 'Lưu bài viết thành công.' });
  } catch (error) {
    console.error('❌ Lỗi khi lưu bài viết:', error);
    res.status(500).json({ message: 'Lỗi khi lưu bài viết.' });
  }
};

// Hiển thị các bài viết đã lưu của người dùng
exports.viewSavedArticles = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }

    const userId = req.session.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = 5; // Số lượng bài viết mỗi trang

    // Lấy tổng số bài viết đã lưu
    const totalArticles = await fetchSavedNewsCount(userId);
    const totalPages = Math.ceil(totalArticles / perPage);
    const skip = (page - 1) * perPage;

    if (page > totalPages) {
      return res.redirect(`/saved?page=${totalPages}`);
    }

    // Lấy các bài viết đã lưu với phân trang
    const savedNews = await fetchSavedNewsFromDB(userId, skip, perPage);

    res.render('savedNews', {
      news: savedNews,
      currentPage: page,
      totalPages,
      session: req.session,
    });
  } catch (err) {
    console.error('❌ Lỗi khi hiển thị bài viết đã lưu:', err);
    res.status(500).send('Lỗi khi tải bài viết đã lưu.');
  }
};

// Xóa bài viết đã lưu
exports.deleteSavedNews = async (req, res) => {
  const newsId = req.params.id;

  try {
    // Thực hiện xóa bài viết
    const result = await Article.destroy({
      where: { id: newsId },
    });

    if (result === 0) {
      return res.status(404).json({ message: "Bài viết không tìm thấy" });
    }

    return res.status(200).json({ message: "Bài viết đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    return res.status(500).json({ message: "Lỗi khi xóa bài viết" });
  }
};
exports.deleteSavedNewsFromDB = async (userId, newsId) => {
  try {
    const rowsDeleted = await SavedNews.destroy({
      where: { userId, newsId },
    });
    if (rowsDeleted === 0) {
      throw new Error('Không có bài viết nào được xóa.');
    }
    return { affectedRows: rowsDeleted };  // Đảm bảo trả về số dòng bị ảnh hưởng
  } catch (err) {
    throw new Error('Có lỗi khi xóa bài viết.');
  }
};

// Lưu bài viết vào cơ sở dữ liệu
exports.saveNewsToDB = async (userId, newsId) => {
  try {
    const savedNews = await SavedNews.create({ userId, newsId });
    return savedNews;
  } catch (err) {
    throw new Error("Có lỗi khi lưu bài viết.");
  }
};



// Hàm lấy bài viết đã lưu của người dùng với phân trang
exports.getSavedNewsByUser = async (userId, page, limit) => {
  const offset = (page - 1) * limit;
  try {
    const savedNews = await SavedNews.findAndCountAll({
      where: { userId },
      limit: limit,
      offset: offset,
    });
    const totalPages = Math.ceil(savedNews.count / limit);
    return {
      savedNews: savedNews.rows,
      totalPages: totalPages,
      currentPage: page,
    };
  } catch (err) {
    throw new Error("Có lỗi khi lấy danh sách tin tức đã lưu.");
  }
};

// Hiển thị chi tiết bài viết đã lưu
exports.viewSavedArticleDetail = async (req, res) => {
  try {
    const userId = req.session.user.id; // Lấy userId từ session
    const newsId = req.params.id; // Lấy ID bài viết từ URL

    // Kiểm tra xem bài viết đã lưu có tồn tại trong cơ sở dữ liệu không
    const savedNews = await SavedNews.findOne({ where: { userId, newsId } });
    if (!savedNews) {
      return res.status(404).json({ message: 'Bài viết không tồn tại trong danh sách đã lưu.' });
    }

    // Lấy thông tin chi tiết bài viết từ bảng articles
    const article = await News.getNewsById(newsId); // Giả sử News.getNewsById lấy bài viết từ bảng articles
    if (!article) {
      return res.status(404).json({ message: 'Bài viết không tồn tại trong cơ sở dữ liệu.' });
    }

    // Render trang chi tiết bài viết đã lưu
    res.render('savedNewsDetail', {
      article: article,
      session: req.session,
    });
  } catch (err) {
    console.error('❌ Lỗi khi hiển thị chi tiết bài viết:', err);
    res.status(500).send('Lỗi khi tải bài viết chi tiết.');
  }
};
