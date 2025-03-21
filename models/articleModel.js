// articleModel.js
const { db } = require('../db');  // Import pool kết nối từ db.js

// Hàm lưu bài viết vào bảng saved_news
const createSavedNews = async (user_id, title, content, image, link) => {
  try {
    const [result] = await db.execute(
      'INSERT INTO articles (user_id, title, content, image, link) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, content, image, link]
    );
    return result;
  } catch (err) {
    console.error('❌ Lỗi khi lưu bài viết:', err);
    throw err;
  }
};


// Lấy danh sách bài viết
const getArticles = async () => {
  try {
    const [rows] = await db.execute('SELECT * FROM articles');
    return rows;  // Trả về danh sách các bài viết
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách bài viết:', err);
    throw err;
  }
};

// Lấy bài viết theo ID
const getArticleById = async (id) => {
  try {
    const [rows] = await db.execute('SELECT * FROM articles WHERE id = ?', [id]);
    return rows[0];  // Trả về bài viết tìm thấy
  } catch (err) {
    console.error('❌ Lỗi khi lấy bài viết theo ID:', err);
    throw err;
  }
};

// Cập nhật bài viết
const updateArticle = async (id, title, content, image) => {
  try {
    const [result] = await db.execute(
      'UPDATE articles SET title = ?, content = ?, image = ? WHERE id = ?',
      [title, content, image, id]
    );
    return result;  // Trả về kết quả sau khi cập nhật
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật bài viết:', err);
    throw err;
  }
};
// Lưu bài viết vào saved_news
const saveArticle = async (userId, title, content) => {
  try {
      const [result] = await db.execute(
          'INSERT INTO articles (user_id, title, content, created_at) VALUES (?, ?, ?, NOW())',
          [userId, title, content]
      );
      return result; // Trả về kết quả (vd: ID của bài viết vừa thêm)
  } catch (err) {
      console.error('❌ Lỗi khi lưu bài viết:', err);
      throw err;
  }
};

// Phương thức lấy bài viết đã lưu của người dùng
const getSavedNewsByUser = async (userId) => {
  try {
    // Truy vấn lấy bài viết đã lưu của người dùng
    const [rows] = await db.execute(
      'SELECT * FROM articles WHERE user_id = ?',
      [userId]
    );
    return rows;  // Trả về danh sách bài viết đã lưu
  } catch (err) {
    console.error('Lỗi khi lấy bài viết đã lưu:', err);
    throw err;  // Ném lại lỗi nếu có
  }
};
// Xóa bài viết đã lưu
const deleteSavedNews = async (userId, newsId) => {
  try {
    const [result] = await db.execute(
      'DELETE FROM articles WHERE user_id = ? AND id = ?',
      [userId, newsId]
    );
    return result;  // Trả về kết quả xóa
  } catch (err) {
    console.error('❌ Lỗi khi xóa bài viết:', err);
    throw err;
  }
};


module.exports = {
  createSavedNews,
  getArticles,
  getArticleById,
  updateArticle,
  saveArticle,
  getSavedNewsByUser,
  deleteSavedNews,
};