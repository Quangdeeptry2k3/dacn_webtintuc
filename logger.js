const winston = require('winston');

const logger = winston.createLogger({
  level: 'info', // Cấu hình mức độ log
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()  // Log theo dạng JSON
  ),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),  // Ghi log chung
    new winston.transports.File({ filename: 'error.log', level: 'error' }),  // Ghi log lỗi
    new winston.transports.Console({ format: winston.format.simple() }) // Ghi log vào console
  ]
});

module.exports = logger;
