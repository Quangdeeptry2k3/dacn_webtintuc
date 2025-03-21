const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Kết nối đến database MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2003',
  database: process.env.DB_NAME || 'web_tin_tuc',
});

// Kiểm tra mật khẩu khi đăng nhập
const checkPassword = async (username, password) => {
  try {
    // Lấy người dùng từ cơ sở dữ liệu theo username
    const [results] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

    // Nếu không tìm thấy người dùng
    if (results.length === 0) {
      console.log(`Không tìm thấy người dùng với tên đăng nhập: ${username}`);
      return null;  // Trả về null nếu không tìm thấy người dùng
    }

    const user = results[0]; // Lấy thông tin người dùng

    // So sánh mật khẩu với mật khẩu đã được mã hóa
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Mật khẩu không hợp lệ');
      return null; // Nếu mật khẩu không đúng, trả về null
    }

    // Trả về thông tin người dùng nếu mật khẩu hợp lệ
    return user;
  } catch (err) {
    console.error('Lỗi khi kiểm tra mật khẩu:', err);
    throw err;
  }
};


// Tạo người dùng mới (Đăng ký)
const createUser = async (username, password) => {
  try {
    // Kiểm tra xem tên người dùng đã tồn tại chưa
    const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      console.log(`User with username ${username} already exists`);
      return { error: 'Username already exists.' }; // Trả về lỗi nếu tên người dùng đã tồn tại
    }

    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thực hiện lệnh INSERT để tạo người dùng mới
    const [result] = await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    // Trả về kết quả nếu tạo thành công
    return result;
  } catch (err) {
    console.error('Error creating user:', err);
    throw err; // Ném lỗi ra ngoài nếu có vấn đề
  }
};

// Lấy người dùng theo ID
const getUserById = async (userId) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return null; // Nếu không tìm thấy người dùng
    }
    return rows[0]; // Trả về người dùng tìm thấy
  } catch (err) {
    console.error('Error getting user by ID:', err);
    throw err;
  }
};

module.exports = { checkPassword, createUser, getUserById };
