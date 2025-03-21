require('dotenv').config();  // Nạp các biến môi trường từ file .env

const mysql = require('mysql2/promise');  // Dùng mysql2 để tạo pool kết nối

// Kiểm tra các biến môi trường bắt buộc
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Các biến môi trường sau không được cấu hình trong .env: ${missingEnvVars.join(', ')}`);
  process.exit(1);  // Dừng chương trình nếu thiếu biến môi trường
} else {
  console.log(':rocket: Đã nạp đầy đủ các biến môi trường:', requiredEnvVars.join(', '));
}

// Tạo pool kết nối MySQL với cấu hình từ các biến môi trường
const db = mysql.createPool({
  host: process.env.DB_HOST,       // Ví dụ: 'localhost'
  user: process.env.DB_USER,       // Ví dụ: 'root'
  password: process.env.DB_PASSWORD,  // Mật khẩu người dùng MySQL
  database: process.env.DB_NAME,   // Ví dụ: 'web_tin_tuc'
  port: process.env.DB_PORT,       // Ví dụ: '3306'
});

// Kết nối cơ sở dữ liệu và kiểm tra kết nối
const connectDB = async () => {
  try {
    console.log('🚀 Đang kết nối MySQL với cấu hình:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? '********' : 'Không có mật khẩu',
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const connection = await db.getConnection();  // Lấy kết nối từ pool
    console.log('🚀 Kết nối cơ sở dữ liệu thành công!');
    connection.release();  // Giải phóng kết nối sau khi kiểm tra
  } catch (err) {
    console.error('❌ Kết nối cơ sở dữ liệu thất bại:', err.message);
    process.exit(1);  // Dừng chương trình nếu không thể kết nối
  }
};

module.exports = { db, connectDB };
