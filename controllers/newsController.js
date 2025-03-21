const News = require('../models/newsModel');
const newsModel = require('../models/newsModel'); // Chú ý tên đúng theo tệp

const User = require('../models/userModel');
const { db } = require('../db');

// Kiểm tra xem đã import đúng model chưa
const ArticleModel = require('../models/articleModel'); // Đảm bảo đường dẫn đúng

// Import từ models/articleModel.js
const { createSavedNews, getSavedNewsByUser } = require('../models/articleModel');

// Hàm kiểm tra trạng thái đăng nhập
const checkLoginStatus = (req) => {
  return req.session && req.session.user ? true : false;
};

// Lấy danh sách tin tức
exports.getNews = async (req, res) => {
  const errorMessage = req.flash("error")[0] || "";
  const successMessage = req.flash("success")[0] || "";
  const page = parseInt(req.query.page, 10) || 1;
  const category = req.query.category || "";

  try {
    const perPage = 9; // Số bài viết mỗi trang
    const { currentPageData, totalArticles } = await News.getNews(page, perPage, category);

    const totalPages = totalArticles > 0 ? Math.ceil(totalArticles / perPage) : 1;
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    res.render("news", {
      newsData: currentPageData,
      errorMessage,
      successMessage,
      session: req.session,
      currentPage: page,
      totalPages,
      prevPage,
      nextPage,
      category,
      isLoggedIn: checkLoginStatus(req),
    });
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    req.flash("error", "Không thể lấy tin tức. Vui lòng thử lại sau.");
    res.render("news", {
      newsData: [],
      errorMessage: "Không thể lấy tin tức. Vui lòng thử lại sau.",
      successMessage,
      session: req.session,
      currentPage: page,
      totalPages: 1,
      prevPage: null,
      nextPage: null,
      isLoggedIn: checkLoginStatus(req),
    });
  }
};


// Lưu bài viết
exports.saveNews = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Bạn cần đăng nhập để lưu bài viết." });
    }

    const userId = req.session.user.id;
    const { newsId } = req.body;

    const news = await News.getNewsById(newsId);
    if (!news) {
      return res.status(404).json({ message: "Bài viết không tồn tại." });
    }

    await ArticleModel.createSavedNews(userId, news.title, news.content, news.image, news.link);
    res.status(200).json({ message: "Lưu bài viết thành công." });
  } catch (error) {
    console.error('❌ Lỗi khi lưu bài viết:', error);
    res.status(500).json({ message: "Lỗi khi lưu bài viết." });
  }
};

// Xem danh sách bài viết đã lưu
exports.viewSavedArticles = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }

    const userId = req.session.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = 5;

    const savedNews = await ArticleModel.getSavedNewsByUser(userId);
    const totalArticles = savedNews.length;
    const totalPages = Math.ceil(totalArticles / perPage);
    const currentPageData = savedNews.slice((page - 1) * perPage, page * perPage);

    res.render('savedNews', {
      news: currentPageData,
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
  try {
    const userId = req.session.user.id;
    const { newsId } = req.params;

    const result = await ArticleModel.deleteSavedNews(userId, newsId);
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Bài viết đã được xóa thành công." });
    }

    res.status(404).json({ message: "Bài viết không tồn tại hoặc đã bị xóa." });
  } catch (error) {
    console.error('❌ Lỗi khi xóa bài viết:', error);
    res.status(500).json({ message: "Lỗi khi xóa bài viết." });
  }
};
exports.getAboutPage = (req, res) => {
  const aboutData = {
    title: "Giới thiệu về VNExpress",
    description: "Web Craw của tôi là một công cụ tự động thu thập tin tức từ VNExpress, giúp người dùng tiếp cận thông tin mới nhất và chính xác nhất từ trang web này.",
    mission: "Cung cấp một nền tảng thân thiện, nhanh chóng và chính xác để truy cập thông tin từ VNExpress.",
    vision: "Trở thành công cụ hàng đầu hỗ trợ người dùng theo dõi và phân tích tin tức tại Việt Nam.",
    teamMembers: [
      { name: "Trần Tiến Giang", role: "ADMIN" },
      { name: "Hoàng Trung Nguyên", role: "ADMIN" },
      { name: "Lê Trần Nhật Quang", role: "ADMIN" },
    ],
  };

  const isLoggedIn = checkLoginStatus(req);

  res.render("about", { aboutData, isLoggedIn });
};

exports.getContactPage = (req, res) => {
  const contactData = {
    title: "Liên Hệ",
    description: "Nếu bạn có bất kỳ câu hỏi, góp ý hoặc cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi qua các kênh dưới đây.",
    facebook: "https://www.facebook.com/giangit15",
    zalo: "https://zalo.me/0387193309",
    email: "tiengiang105@gmail.com",
    phone: "0383.495.613",
    address: "123 Đường Tin Tức, Thành phố HCM, Việt Nam",
    workingHours: "Thứ 2 - Thứ 6: 8:00 - 18:00, Thứ 7: 8:00 - 12:00",
  };

  const isLoggedIn = checkLoginStatus(req);

  res.render("contact", { contactData, isLoggedIn });
};

exports.viewAllNews = async (req, res) => {
  try {
    const news = await newsModel.getAllNews();
    res.render('news', { news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNewsDetails = async (req, res) => {
  try {
    const newsId = req.params.id;
    const news = await newsModel.getNewsById(newsId);

    if (!news) {
      return res.status(404).render('404', { message: 'Bài viết không tồn tại.' });
    }

    // Chuyển thành article và truyền thông báo thành công nếu có
    res.render('news-detail', {
      article: news,
      message: req.flash('success')[0] || null  // Truyền thông báo nếu có
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Đã xảy ra lỗi.' });
  }
};
