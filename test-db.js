require('dotenv').config(); // Đảm bảo nạp biến môi trường

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối:', err.message);
    } else {
        console.log('Kết nối thành công!');
    }
    connection.end();
});
