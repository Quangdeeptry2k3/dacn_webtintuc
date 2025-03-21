const jwt = require("jsonwebtoken");

// Kiểm tra session đăng nhập
exports.isLoggedIn = (req, res, next) => {
  if (req.session?.user?.id) {
    return next();
  }
  req.flash("error", "Bạn phải đăng nhập để truy cập.");
  return res.redirect("/auth/login");
};

// Ngăn chặn thao tác với tài khoản của chính mình
exports.preventSelfAction = (req, res, next) => {
  const { id } = req.params; // ID mục tiêu
  const userId = req.session?.user?.id; // ID người dùng hiện tại (đăng nhập)

  if (!userId) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập." });
  }

  if (parseInt(userId, 10) === parseInt(id, 10)) {
    return res.status(403).json({ message: "Bạn không thể thao tác với tài khoản của chính mình." });
  }

  next();
};

// Xác thực người dùng đã đăng nhập qua session
exports.isAuthenticated = (req, res, next) => {
  console.log("Session user:", req.session?.user); // Kiểm tra thông tin session
  if (req.session?.user?.id) {
    req.user = req.session.user; // Gán user từ session vào req.user nếu cần
    return next();
  }
  req.flash("error", "Bạn phải đăng nhập để lưu bài viết.");
  return res.redirect("/auth/login");
};

// Middleware xác thực JWT
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gán thông tin người dùng vào req
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};
