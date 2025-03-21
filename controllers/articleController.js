const {
  createArticle,
  getArticles,
  getArticleById,
  saveArticle,
  getSavedArticles,
} = require('../models/articleModel');
const { getUserById } = require('../models/userModel');

// Hàm tạo bài viết mới
const addArticle = async (req, res) => {
  try {
    const { user_id, title, content, image } = req.body;

    // Kiểm tra xem user_id có hợp lệ và tồn tại không
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).send("Không tìm thấy người dùng.");
    }

    // Tạo bài viết nếu user hợp lệ
    await createArticle(user_id, title, content, image);
    res.redirect('/news');
  } catch (err) {
    console.error('❌ Lỗi khi tạo bài viết:', err);
    res.status(500).send("Lỗi khi tạo bài viết");
  }
};

// Hàm lấy danh sách bài viết
const listArticles = async (req, res) => {
  try {
    const articles = await getArticles();
    res.render('news', { articles });
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách bài viết:', err);
    res.status(500).send("Lỗi khi lấy danh sách bài viết");
  }
};

// Hàm lấy bài viết theo ID
const showArticle = async (req, res) => {
  try {
    const article = await getArticleById(req.params.id);
    res.render('news-detail', { article });
  } catch (err) {
    console.error('❌ Lỗi khi lấy bài viết theo ID:', err);
    res.status(500).send("Lỗi khi lấy bài viết");
  }
};

// Hiển thị các bài viết đã lưu
const viewSavedArticles = async (req, res) => {
  try {
    const user_id = req.session?.user?.id;

    if (!user_id) {
      req.flash("error", "Bạn cần đăng nhập để xem bài viết đã lưu.");
      return res.redirect("/auth/login");
    }

    const savedArticles = await getSavedArticles(user_id);
    res.render("saveNews", { news: savedArticles });
  } catch (err) {
    console.error("❌ Lỗi khi hiển thị bài viết đã lưu:", err);
    res.status(500).send("Không thể tải bài viết đã lưu.");
  }
};

// Lưu bài viết
const saveNews = async (req, res) => {
  try {
    const user_id = req.session?.user?.id;
    const { newsId } = req.body;

    if (!user_id) {
      req.flash("error", "Bạn cần đăng nhập để lưu bài viết.");
      return res.redirect("/auth/login");
    }

    // Gọi hàm saveArticle để lưu bài viết vào cơ sở dữ liệu
    await saveArticle(user_id, newsId);

    // Sau khi lưu thành công, render trang 'save.ejs' với thông báo thành công
    res.render('save', { message: 'Lưu bài viết thành công.' });
  } catch (err) {
    console.error("❌ Lỗi khi lưu bài viết:", err);
    req.flash("error", "Không thể lưu bài viết.");
    res.redirect("/news");
  }
};

module.exports = {
  addArticle,
  listArticles,
  showArticle,
  saveNews,
  viewSavedArticles,
};
