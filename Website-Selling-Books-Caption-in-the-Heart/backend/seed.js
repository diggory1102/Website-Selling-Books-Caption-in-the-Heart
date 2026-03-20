// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Role, User } = require('./database'); // Import model từ file database.js của bạn

async function seedData() {
    try {
        // 1. Kết nối DB
        await mongoose.connect('mongodb://127.0.0.1:27017/web_ban_truyen');
        console.log("-> Đã kết nối DB để tạo dữ liệu mẫu...");

        // Xóa dữ liệu cũ để tránh trùng lặp khi chạy lại (Tùy chọn)
        await Role.deleteMany({});
        await User.deleteMany({});

        // 2. Tạo các vai trò (Roles)
        const adminRole = await Role.create({ name: 'admin', authority: 'FULL_ACCESS' });
        const staffRole = await Role.create({ name: 'staff', authority: 'MANAGE_ORDERS' });
        const customerRole = await Role.create({ name: 'customer', authority: 'BUY_ONLY' });
        console.log("✅ Đã tạo các Role: admin, staff, customer");

        // 3. Mã hóa mật khẩu mẫu
        const hashedAdminPass = await bcrypt.hash('admin123', 10);
        const hashedStaffPass = await bcrypt.hash('staff123', 10);

        // 4. Tạo tài khoản Admin mẫu
        await User.create({
            userName: 'admin_hethong',
            password: hashedAdminPass,
            fullName: 'Quản Trị Viên Lõi C++',
            email: 'admin@gmail.com',
            roleId: adminRole._id, // Gán quyền Admin
            isOnline: false
        });

        // 5. Tạo tài khoản Nhân viên mẫu
        await User.create({
            userName: 'nhanvien_01',
            password: hashedStaffPass,
            fullName: 'Nguyễn Văn Nhân Viên',
            email: 'staff@gmail.com',
            roleId: staffRole._id, // Gán quyền Staff
            isOnline: false
        });

        console.log("✅ Đã tạo xong tài khoản mẫu:");
        console.log("- Admin: admin@gmail.com / admin123");
        console.log("- Staff: staff@gmail.com / staff123");

    } catch (error) {
        console.error("❌ Lỗi khi tạo dữ liệu:", error);
    } finally {
        mongoose.connection.close();
    }
}

seedData();