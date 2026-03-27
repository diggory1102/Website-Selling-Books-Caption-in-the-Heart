const bcrypt = require('bcryptjs');
const { User } = require('../database');
const { execFile } = require('child_process');
const path = require('path');

// ==========================================
// 1. ĐĂNG KÝ
// ==========================================
const register = async (req, res) => {
    try {
        const { userName, email, password, fullName } = req.body;
        
        const userExists = await User.findOne({ $or: [{ userName }, { email }] });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc Email đã được sử dụng!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({ userName, email, fullName, password: hashedPassword });

        res.json({ success: true, message: "Đăng ký thành công! Hãy đăng nhập." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// ==========================================
// 2. ĐĂNG NHẬP
// ==========================================
const login = async (req, res) => {
    try {
        const { userName, password } = req.body;

        const user = await User.findOne({ userName });
        if (!user) {
            return res.status(400).json({ success: false, message: "Tài khoản không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Sai mật khẩu!" });
        }

        res.json({ 
            success: true, 
            message: "Đăng nhập thành công!",
            user: { id: user._id, userName: user.userName, fullName: user.fullName, role: user.roleId }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// ==========================================
// 3. QUÊN MẬT KHẨU
// ==========================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(400).json({ success: false, message: "Email này chưa được đăng ký!" });

        res.json({ success: true, message: "Hướng dẫn lấy lại mật khẩu đã được gửi vào email của bạn!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// ==========================================
// 4. ĐĂNG NHẬP ADMIN (GỌI C++)
// ==========================================
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate('roleId');
        if (!user) return res.status(401).json({ success: false, message: "Email không tồn tại!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Sai mật khẩu!" });

        const roleName = user.roleId ? user.roleId.name.toLowerCase() : "customer";

        // Đã cập nhật lại đường dẫn lùi 2 cấp thư mục (../../) do file này nằm trong controllers/
        const cppExePath = path.join(__dirname, '../../cpp_auth_core/auth_system.exe'); 

        execFile(cppExePath, [email, roleName], (error, stdout, stderr) => {
            if (error) {
                console.error("Lỗi khi chạy C++:", error);
                return res.status(500).json({ success: false, message: "Lỗi hệ thống lõi C++" });
            }

            try {
                const cppResult = JSON.parse(stdout.trim());
                if (cppResult.success) {
                    res.json({ success: true, message: cppResult.message, role: cppResult.role, user: { id: user._id, fullName: user.fullName, email: user.email } });
                } else {
                    res.status(403).json({ success: false, message: cppResult.message });
                }
            } catch (parseErr) {
                res.status(500).json({ success: false, message: "C++ trả về sai định dạng" });
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { register, login, forgotPassword, adminLogin };