require("dotenv").config();  // Nạp các biến môi trường từ tệp .env
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const helmet = require("helmet");
const cors = require("cors");
const winston = require("winston");
const { Sequelize } = require("sequelize");
const authRoutes = require("./routes/authRoutes");
const newsRoutes = require("./routes/newsRoutes");
const articlesRoutes = require('./routes/articlesRoutes');
const savedNewsRoutes = require('./routes/savedNewsRoutes');
const { fetchNews } = require('./utils/crawlUtils');  // Import hàm crawl
const methodOverride = require("method-override"); // Thêm method-override

// Khởi tạo express
const app = express();

// Middleware và cấu hình khác
app.use('/saved', savedNewsRoutes);

// === KẾT NỐI DATABASE ===
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  dialect: 'mysql',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  }
});

// Kiểm tra kết nối MySQL
sequelize.authenticate()
  .then(() => console.log("✅ Đã kết nối cơ sở dữ liệu MySQL!"))
  .catch((err) => {
    console.error("❌ Lỗi kết nối MySQL:", err);
    process.exit(1);
  });

// === LOGGER WINSTON ===
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// === MIDDLEWARE BẢO MẬT ===
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));

// === MIDDLEWARE SESSION & FLASH ===
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',  // Chỉ gửi cookie qua HTTPS khi ở môi trường production
    }
  })
);

app.use(flash());

// === MIDDLEWARE CƠ BẢN ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method')); // Thêm middleware method-override
app.use(express.static(path.join(__dirname, "public")));

// === VIEW ENGINE ===
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// === ROUTES ===
app.get("/", (req, res) => {
  const errorMessage = req.flash("error")[0] || "";
  const successMessage = req.flash("success")[0] || "";
  res.render("index", {
    errorMessage,
    successMessage,
    session: req.session,
  });
});

app.use("/auth", authRoutes);
app.use("/news", newsRoutes);
app.use("/api", articlesRoutes);

// === XỬ LÝ LỖI 404 (NOT FOUND) ===
app.use((req, res) => {
  res.status(404).render("404", { message: "Trang không tồn tại!" });
});

// === XỬ LÝ LỖI TOÀN CỤC ===
app.use((err, req, res, next) => {
  console.error("❌ Lỗi toàn cục:", err);
  logger.error(err); 
  res.status(500).render("error", { message: "Đã xảy ra lỗi máy chủ." });
});

// === LẮNG NGHE CỔNG ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🌐 Server chạy tại: http://localhost:${PORT}`);

  // Gọi hàm crawl khi server bắt đầu
  try {
    console.log("Bắt đầu crawl dữ liệu...");
    await fetchNews();  // Gọi hàm crawl
    console.log("Crawl dữ liệu thành công!");
  } catch (err) {
    console.error("Lỗi khi crawl dữ liệu:", err);
  }
});
