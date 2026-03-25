// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Role, User, Product, Bill, Payment, Delivery } = require('./database');

async function seedData() {
    try {
        // 1. Kết nối DB
        await mongoose.connect('mongodb://127.0.0.1:27017/web_ban_truyen');
        console.log("-> Đã kết nối DB để tạo dữ liệu mẫu...");

        // Xóa dữ liệu cũ để tránh trùng lặp khi chạy lại (Tùy chọn)
        await Role.deleteMany({});
        await User.deleteMany({});
        await Bill.deleteMany({});
        await Payment.deleteMany({});
        await Delivery.deleteMany({});

        // 2. Tạo các vai trò (Roles)
        const adminRole = await Role.create({ name: 'admin', authority: 'FULL_ACCESS' });
        const staffRole = await Role.create({ name: 'staff', authority: 'MANAGE_ORDERS' });
        const customerRole = await Role.create({ name: 'customer', authority: 'BUY_ONLY' });
        console.log("✅ Đã tạo các Role: admin, staff, customer");

        // 3. Mã hóa mật khẩu mẫu
        const hashedAdminPass = await bcrypt.hash('admin123', 10);
        const hashedStaffPass = await bcrypt.hash('staff123', 10);
        const hashedCustomerPass = await bcrypt.hash('customer123', 10);

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

        // 6. Tạo tài khoản Khách hàng mẫu
        const customer = await User.create({
            userName: 'khachhang_01',
            password: hashedCustomerPass,
            fullName: 'Khách Hàng Test',
            email: 'customer@gmail.com',
            roleId: customerRole._id,
            isOnline: false
        });

        console.log("✅ Đã tạo xong tài khoản mẫu:");
        console.log("- Admin: admin@gmail.com / admin123");
        console.log("- Staff: staff@gmail.com / staff123");
        console.log("- Customer: khachhang_01 / customer123");

        // ==========================================
        // 7. TẠO CÁC ĐƠN HÀNG MẪU CHO KHÁCH HÀNG NÀY
        // ==========================================
        const products = await Product.find().limit(2);
        if (products.length > 0) {
            const p1 = products[0];
            const p2 = products.length > 1 ? products[1] : products[0];

            // Đơn 1: ĐANG GIAO
            const pay1 = await Payment.create({ method: 'COD', status: 'Chưa thanh toán' });
            const del1 = await Delivery.create({ unitName: 'Giao hàng tiêu chuẩn', status: 'Đang giao hàng' });
            await Bill.create({
                userId: customer._id, paymentId: pay1._id, deliveryId: del1._id,
                customerName: customer.fullName, customerPhone: '0987654321',
                shippingAddress: '123 Đường Test, Phường Test, Quận Test, TP Test', note: 'Giao giờ hành chính',
                subTotal: p1.price * 2, totalPrice: p1.price * 2 + 30000, shippingFee: 30000,
                status: 'Đang giao',
                items: [{ productId: p1._id, productName: p1.name, quantity: 2, priceAtPurchase: p1.price }]
            });

            // Đơn 2: ĐÃ GIAO (Hoàn thành)
            const pay2 = await Payment.create({ method: 'MOMO', status: 'Đã thanh toán' });
            const del2 = await Delivery.create({ unitName: 'Giao hàng hỏa tốc', status: 'Giao hàng thành công' });
            await Bill.create({
                userId: customer._id, paymentId: pay2._id, deliveryId: del2._id,
                customerName: customer.fullName, customerPhone: '0987654321',
                shippingAddress: '456 Đường Demo, Phường Demo, Quận Demo, TP Demo', note: 'Không có',
                subTotal: p2.price * 1, totalPrice: p2.price * 1 + 30000, shippingFee: 30000,
                status: 'Đã giao',
                items: [{ productId: p2._id, productName: p2.name, quantity: 1, priceAtPurchase: p2.price }]
            });

            // Đơn 3: ĐÃ GIAO (Có 2 sản phẩm)
            const pay3 = await Payment.create({ method: 'BANK', status: 'Đã thanh toán' });
            const del3 = await Delivery.create({ unitName: 'Giao hàng tiết kiệm', status: 'Giao hàng thành công' });
            await Bill.create({
                userId: customer._id, paymentId: pay3._id, deliveryId: del3._id,
                customerName: customer.fullName, customerPhone: '0911222333',
                shippingAddress: '789 Đường Fake, Phường Fake, Quận Fake, TP Fake', note: 'Giao buổi sáng',
                subTotal: p1.price + p2.price, totalPrice: p1.price + p2.price + 30000, shippingFee: 30000,
                status: 'Đã giao',
                items: [
                    { productId: p1._id, productName: p1.name, quantity: 1, priceAtPurchase: p1.price },
                    { productId: p2._id, productName: p2.name, quantity: 1, priceAtPurchase: p2.price }
                ]
            });
            console.log("✅ Đã tạo các đơn hàng mẫu (Đang giao, Đã giao) cho Khách hàng!");
        }

    } catch (error) {
        console.error("❌ Lỗi khi tạo dữ liệu:", error);
    } finally {
        mongoose.connection.close();
    }
}

seedData();