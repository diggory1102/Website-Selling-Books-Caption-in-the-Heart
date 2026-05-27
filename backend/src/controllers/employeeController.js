const { User, Role } = require('../models/database');
const bcrypt = require('bcryptjs');

// Lấy danh sách nhân viên (Role: admin hoặc staff)
const getEmployees = async (req, res) => {
    try {
        const roles = await Role.find({ name: { $in: ['admin', 'staff'] } });
        const roleIds = roles.map(r => r._id);
        
        const employees = await User.find({ roleId: { $in: roleIds } })
            .populate('roleId', 'name')
            .select('-password');
            
        res.json({ success: true, employees });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách nhân viên" });
    }
};

// Thêm nhân viên mới
const addEmployee = async (req, res) => {
    try {
        const { fullName, userName, password, email, phone, roleName, gender, dob, cccd, avatar } = req.body;
        
        // Kiểm tra ngày sinh hợp lệ
        if (dob) {
            const dobDate = new Date(dob);
            if (isNaN(dobDate.getTime())) {
                return res.status(400).json({ success: false, message: "Ngày sinh không hợp lệ!" });
            }
            if (dobDate > new Date()) {
                return res.status(400).json({ success: false, message: "Ngày sinh không thể ở tương lai!" });
            }
        }

        // Kiểm tra username/email tồn tại
        const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
        if (existingUser) return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc Email đã tồn tại!" });

        // Lấy roleId dựa trên roleName (mặc định là staff nếu không có)
        const role = await Role.findOne({ name: roleName || 'staff' });
        if (!role) return res.status(400).json({ success: false, message: "Quyền hạn không hợp lệ!" });

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newEmployee = await User.create({
            fullName,
            userName,
            password: hashedPassword,
            email,
            numberPhone: phone,
            roleId: role._id,
            gender,
            dateOfBirth: dob,
            cccd,
            avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userName
        });

        res.json({ success: true, message: "Thêm nhân viên thành công!", employee: newEmployee });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi thêm nhân viên" });
    }
};

// Xóa nhân viên
const deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });

        // Không cho phép xóa admin chính (tùy chọn bảo mật)
        const adminRole = await Role.findOne({ name: 'admin' });
        if (employee.roleId.toString() === adminRole._id.toString() && employee.userName === 'admin') {
            return res.status(403).json({ success: false, message: "Không thể xóa Admin hệ thống!" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Đã xóa nhân viên!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi xóa nhân viên" });
    }
};

module.exports = { getEmployees, addEmployee, deleteEmployee };
