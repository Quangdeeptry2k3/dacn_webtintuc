const bcrypt = require('bcrypt');
const axios = require('axios');
const { db } = require('../db');

// Kiểm tra kết nối API
const checkApiConnection = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    return response.status === 200;
  } catch (err) {
    console.error('❌ Lỗi kết nối API:', err);
    return false;
  }
};

/** ========== Đăng nhập ========== */
exports.postLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!(await checkApiConnection())) {
    req.flash("errorMessage", "API không khả dụng, vui lòng thử lại sau.");
    return res.redirect("/auth/login");
  }

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    if (results.length === 0) {
      req.flash("errorMessage", "Tên đăng nhập không tồn tại!");
      return res.redirect("/auth/login");
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      req.flash("errorMessage", "Sai mật khẩu!");
      return res.redirect("/auth/login");
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    req.flash("successMessage", "Đăng nhập thành công!");
    res.redirect("/news");
  } catch (err) {
    console.error("❌ Error in login:", err.message);
    req.flash("errorMessage", "Đã xảy ra lỗi khi đăng nhập.");
    res.redirect("/auth/login");
  }
};

/** ========== Đăng ký ========== */
exports.postRegister = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!(await checkApiConnection())) {
    req.flash("errorMessage", "API không khả dụng, vui lòng thử lại sau.");
    return res.redirect("/auth/register");
  }

  if (password !== confirmPassword) {
    req.flash("errorMessage", "Mật khẩu không khớp!");
    return res.redirect("/auth/register");
  }

  try {
    const [existingUser] = await db.execute("SELECT username FROM users WHERE username = ?", [username]);
    if (existingUser.length > 0) {
      req.flash("errorMessage", "Tên đăng nhập đã tồn tại!");
      return res.redirect("/auth/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
      username,
      hashedPassword,
      "user",
    ]);

    req.flash("successMessage", "Đăng ký thành công!");
    res.redirect("/auth/login");
  } catch (err) {
    console.error("❌ Error in register:", err.message);
    req.flash("errorMessage", "Đã xảy ra lỗi khi đăng ký.");
    res.redirect("/auth/register");
  }
};

/** ========== Đăng xuất ========== */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Lỗi khi đăng xuất:', err);
      req.flash('errorMessage', 'Không thể đăng xuất.');
      return res.redirect('/');
    }
    res.redirect('/auth/login');
  });
};

/** ========== Trang quản trị ========== */
exports.getAdminPage = async (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    try {
      const searchQuery = req.query.search || ''; // Lấy từ khóa tìm kiếm từ query string
      const [users] = await db.execute(
        `SELECT id, username, role FROM users WHERE username LIKE ?`,
        [`%${searchQuery}%`]
      );

      const { errorMessage, successMessage } = getFlashMessages(req);
      res.render('admin', {
        userSession: req.session.user, // Truyền session người dùng vào view
        users,
        searchQuery,
        errorMessage,
        successMessage // Truyền thêm successMessage và errorMessage vào view
      });
    } catch (err) {
      console.error('❌ Lỗi khi lấy danh sách người dùng:', err);
      req.flash('errorMessage', 'Đã xảy ra lỗi khi tải trang quản trị.');
      res.redirect('/auth/admin');
    }
  } else {
    res.status(403).send('Bạn không có quyền truy cập trang này.');
  }
};

/** ========== Thêm người dùng mới ========== */
exports.addUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!(await checkApiConnection())) {
    req.flash('errorMessage', 'API không khả dụng, vui lòng thử lại sau.');
    return res.redirect('/auth/admin');
  }

  try {
    const [existingUser] = await db.execute('SELECT username FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      req.flash('errorMessage', 'Tên người dùng đã tồn tại!');
      return res.redirect('/auth/admin');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'user']);

    req.flash('successMessage', 'Thêm tài khoản thành công!');
    return res.redirect('/auth/admin');
  } catch (err) {
    console.error('❌ Lỗi khi thêm tài khoản:', err);
    req.flash('errorMessage', 'Đã xảy ra lỗi khi thêm tài khoản.');
    return res.redirect('/auth/admin');
  }
};

/** ========== Phân quyền người dùng ========== */
exports.assignRole = async (req, res) => {
  const userId = req.params.id;
  const loggedInUserId = req.session.user.id; // Lấy ID của admin hiện tại

  // Kiểm tra nếu admin cố gắng phân quyền cho chính mình
  if (userId == loggedInUserId) {
    req.flash('errorMessage', 'Bạn không thể phân quyền cho chính mình!');
    return res.redirect('/auth/admin');
  }

  const { role } = req.body;

  try {
    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    req.flash('successMessage', 'Phân quyền thành công!');
    res.redirect('/auth/admin');
  } catch (err) {
    console.error('❌ Lỗi khi phân quyền:', err);
    req.flash('errorMessage', 'Đã xảy ra lỗi khi phân quyền!');
    res.redirect(`/auth/admin`);
  }
};

/** ========== Chỉnh sửa người dùng ========== */
exports.editUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const [user] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);

    if (user.length === 0) {
      req.flash('errorMessage', 'Người dùng không tồn tại!');
      return res.redirect('/auth/admin');
    }

    const { errorMessage, successMessage } = getFlashMessages(req);
    res.render('editUser', { user: user[0], errorMessage, successMessage });
  } catch (err) {
    console.error('❌ Lỗi khi lấy thông tin người dùng để chỉnh sửa:', err);
    req.flash('errorMessage', 'Đã xảy ra lỗi!');
    res.redirect('/auth/admin');
  }
};

// Helper function to get flash messages
function getFlashMessages(req) {
  return {
    errorMessage: req.flash('errorMessage'),
    successMessage: req.flash('successMessage')
  };
}

/** ========== Cập nhật thông tin người dùng ========== */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, password, role } = req.body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?', [username, hashedPassword, role, userId]);
    } else {
      await db.execute('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, userId]);
    }

    req.flash('successMessage', 'Cập nhật thông tin người dùng thành công!');
    res.redirect('/auth/admin');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật thông tin người dùng:', err);
    req.flash('errorMessage', 'Đã xảy ra lỗi khi cập nhật.');
    res.redirect(`/auth/admin/edit/${req.params.id}`);
  }
};

/** ========== Xóa người dùng ========== */
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  const loggedInUserId = req.session.user.id; // Lấy ID của admin hiện tại

  // Kiểm tra nếu admin cố gắng xóa chính mình
  if (userId == loggedInUserId) {
    req.flash('errorMessage', 'Bạn không thể xóa chính mình!');
    return res.redirect('/auth/admin');
  }

  try {
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    req.flash('successMessage', 'Xóa người dùng thành công!');
    res.redirect('/auth/admin');
  } catch (err) {
    console.error('❌ Lỗi khi xóa người dùng:', err);
    req.flash('errorMessage', 'Đã xảy ra lỗi khi xóa người dùng.');
    res.redirect('/auth/admin');
  }
};
