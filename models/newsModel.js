const { db } = require("../db");

// Tạo bảng "news" nếu chưa tồn tại
const createNewsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      link VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      caption TEXT,
      category VARCHAR(50) DEFAULT '',
      crawledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await db.query(query);
    console.log("✅ Bảng 'news' đã được tạo (nếu chưa tồn tại).");
  } catch (error) {
    console.error("❌ Lỗi khi tạo bảng 'news':", error.message);
    throw error;
  }
};

// Hàm thêm bài viết mới vào bảng "news"
const createNews = async (newsData) => {
  const query = `
    INSERT INTO news (title, link, description, image, caption, category, crawledAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    newsData.title,
    newsData.link,
    newsData.description || "Chưa có mô tả",
    newsData.image || "",
    newsData.caption || "",
    newsData.category || "",
    newsData.crawledAt || new Date(),
  ];
  try {
    const [result] = await db.query(query, values);
    return result.insertId;
  } catch (error) {
    console.error("❌ Lỗi khi thêm bài viết:", error.message);
    throw error;
  }
};

// Hàm lấy danh sách bài viết (có phân trang và lọc theo danh mục)
const getNews = async (page, perPage, category) => {
  const offset = (page - 1) * perPage;
  const whereClause = category ? "WHERE category = ?" : "";
  const query = `
    SELECT * FROM news
    ${whereClause}
    ORDER BY crawledAt DESC
    LIMIT ? OFFSET ?
  `;
  const values = category ? [category, perPage, offset] : [perPage, offset];
  try {
    const [rows] = await db.query(query, values);
    const totalArticles = await countNews(category);
    return { currentPageData: rows, totalArticles };
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách bài viết:", error.message);
    throw error;
  }
};

// Hàm đếm tổng số bài viết (theo danh mục nếu có)
const countNews = async (category) => {
  const whereClause = category ? "WHERE category = ?" : "";
  const query = `SELECT COUNT(*) AS total FROM news ${whereClause}`;
  const values = category ? [category] : [];
  try {
    const [[{ total }]] = await db.query(query, values);
    return total;
  } catch (error) {
    console.error("❌ Lỗi khi đếm bài viết:", error.message);
    throw error;
  }
};

// Hàm lấy một bài viết theo id
const getNewsById = async (id) => {
  const query = "SELECT * FROM news WHERE id = ?";
  try {
    const [rows] = await db.query(query, [id]);
    return rows[0];
  } catch (error) {
    console.error("❌ Lỗi khi lấy bài viết theo ID:", error.message);
    throw error;
  }
};

// Hàm lấy tất cả bài viết
const getAllNews = async () => {
  const query = "SELECT * FROM news";
  try {
    const [rows] = await db.query(query);
    return rows;
  } catch (error) {
    console.error("❌ Lỗi khi lấy tất cả bài viết:", error.message);
    throw error;
  }
};

// Xuất các hàm cần sử dụng
module.exports = {
  createNewsTable,
  createNews,
  getNews,
  getNewsById,
  getAllNews,
};