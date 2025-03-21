const db = require('../db'); // Import kết nối CSDL

// Lấy trang dashboard với danh sách người dùng
exports.getDashboard = async (req, res) => {
    try {
        const searchQuery = req.query.search || ''; // Lọc người dùng theo từ khóa tìm kiếm

        // Truy vấn để lấy danh sách người dùng từ bảng 'users'
        const [rows] = await db.query('SELECT * FROM users');

        // Lọc người dùng nếu có từ khóa tìm kiếm
        const filteredUsers = searchQuery
            ? rows.filter(user =>
                  user.username.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : rows;

        // Render ra trang admin với dữ liệu người dùng và thông báo
        res.render('admin', {
            users: filteredUsers,
            searchQuery,
            userSession: req.session.user,
            errorMessage: req.session.errorMessage || null,
            successMessage: req.session.successMessage || null
        });

        // Xóa thông báo sau khi hiển thị
        req.session.errorMessage = null;
        req.session.successMessage = null;
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('admin', {
            users: [],
            searchQuery: '',
            userSession: req.session.user,
            errorMessage: 'Không thể lấy dữ liệu người dùng.',
            successMessage: null
        });
    }
};

// Hàm xóa người dùng
exports.deleteUser = async (req, res) => {
    const currentUserId = req.session.user ? req.session.user.id : null;
    const targetUserId = parseInt(req.params.id, 10);

    // Kiểm tra người dùng hiện tại
    if (!currentUserId) {
        return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
    }

    // Kiểm tra không cho phép xóa chính mình
    if (targetUserId === currentUserId) {
        return res.status(400).json({ message: 'Bạn không thể xóa chính mình!' });
    }

    try {
        // Xóa người dùng khỏi cơ sở dữ liệu
        await db.query('DELETE FROM users WHERE id = ?', [targetUserId]);

        res.json({ message: 'Xóa người dùng thành công.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa người dùng.' });
    }
};

// Hàm phân quyền cho người dùng
exports.assignRole = async (req, res) => {
    const currentUserId = req.session.user ? req.session.user.id : null;
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    // Kiểm tra người dùng hiện tại
    if (!currentUserId) {
        return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
    }

    // Kiểm tra không cho phép thay đổi vai trò của chính mình
    if (targetUserId === currentUserId) {
        return res.status(400).json({ message: 'Bạn không thể thay đổi quyền của chính mình!' });
    }

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }

    try {
        // Cập nhật vai trò của người dùng trong cơ sở dữ liệu
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, targetUserId]);

        res.json({ message: 'Phân quyền thành công.' });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ message: 'Lỗi server khi phân quyền.' });
    }
};
