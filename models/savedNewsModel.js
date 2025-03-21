// Hàm lưu tin tức vào CSDL
exports.saveNewsToDB = async (userId, newsId) => {
  const query = 'INSERT INTO articles (user_id, news_id) VALUES (?, ?)';
  try {
    await db.query(query, [userId, newsId]);
    return { message: "Tin tức đã được lưu thành công." };
  } catch (error) {
    console.error("Lỗi khi lưu tin tức:", error);
    throw new Error("Có lỗi khi lưu tin tức vào cơ sở dữ liệu.");
  }
};

// Hàm lấy tin tức đã lưu từ CSDL với phân trang
exports.fetchSavedNewsFromDB = async (userId, skip, limit) => {
  const query = `
    SELECT n.id, n.title, n.content, n.image, n.link, n.created_at
    FROM articles sn
    JOIN news n ON sn.news_id = n.id
    WHERE sn.user_id = ?
    LIMIT ?, ?
  `;
  try {
    const [rows] = await db.query(query, [userId, skip, limit]);
    return rows;
  } catch (error) {
    console.error("Lỗi khi lấy tin tức đã lưu:", error);
    throw new Error("Có lỗi khi lấy tin tức đã lưu từ cơ sở dữ liệu.");
  }
};

// Hàm đếm số lượng bài viết đã lưu của user
exports.fetchSavedNewsCount = async (userId) => {
  const query = 'SELECT COUNT(*) AS count FROM articles WHERE user_id = ?';
  try {
    const [rows] = await db.query(query, [userId]);
    return rows[0].count;
  } catch (error) {
    console.error("Lỗi khi đếm số lượng bài viết đã lưu:", error);
    throw new Error("Có lỗi khi đếm số lượng bài viết.");
  }
};

// Hàm xóa bài viết đã lưu
exports.deleteSavedNewsFromDB = async (userId, newsId) => {
  const query = 'DELETE FROM articles WHERE user_id = ? AND news_id = ?';
  try {
    const [result] = await db.query(query, [userId, newsId]);
    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy bài viết để xóa.');
    }
    return { message: "Bài viết đã được xóa thành công." };
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    throw new Error("Có lỗi khi xóa bài viết khỏi cơ sở dữ liệu.");
  }
};