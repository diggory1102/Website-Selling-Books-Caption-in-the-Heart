// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Role, User, Product, Category, Bill, Payment, Delivery } = require('./database');

async function seedData() {
    try {
        // 1. Kết nối DB
        await mongoose.connect('mongodb://127.0.0.1:27017/web_ban_truyen');
        console.log("-> Đã kết nối DB để tạo dữ liệu mẫu...");

        // Xóa dữ liệu cũ để tránh trùng lặp khi chạy lại (Tùy chọn)
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Role.deleteMany({});
        await User.deleteMany({});
        await Bill.deleteMany({});
        await Payment.deleteMany({});
        await Delivery.deleteMany({});

        // ==========================================
        // 1.5 TẠO DANH MỤC VÀ SẢN PHẨM MẪU
        // ==========================================
        const categoryNames = [
            'Manga', 'Hành Động', 'Trinh Thám', 'Tình Cảm', 'Học Đường', 
            'Xuyên Không', 'Kinh Dị', 'Hài Hước', 'Thể Thao', 'Khoa Học Viễn Tưởng', 
            'Giả Tưởng', 'Phiêu Lưu', 'Đời Thường', 'Cổ Trang', 'Lịch Sử', 
            'Tâm Lý', 'Phép Thuật', 'Mecha', 'Nấu Ăn', 'Âm Nhạc'
        ];
        
        await Category.insertMany(categoryNames.map(name => ({ name })));
        const cats = await Category.find();
        const getCatId = (name) => cats.find(c => c.name === name)._id;

        await Product.create([
            { name: 'One Piece - Tập 101', authorName: 'Eiichiro Oda', price: 30000, sold: 5000, imageUrl: 'images/one-piece.png', categoryId: getCatId('Manga') },
            { name: 'Naruto - Tập Cuối', authorName: 'Masashi Kishimoto', price: 22000, discount: '-5%', sold: 2100, imageUrl: 'images/naruto.png', categoryId: getCatId('Hành Động') },
            { name: 'Thám Tử Lừng Danh Conan', authorName: 'Gosho Aoyama', price: 25000, discount: '-10%', sold: 3200, imageUrl: 'images/conan.png', categoryId: getCatId('Trinh Thám') },
            { name: 'Your Name - Tên Cậu Là Gì?', authorName: 'Makoto Shinkai', price: 45000, discount: '-15%', sold: 1500, imageUrl: 'images/your-name.png', categoryId: getCatId('Tình Cảm') },
            { name: 'My Hero Academia - Tập 1', authorName: 'Kohei Horikoshi', price: 28000, sold: 3400, imageUrl: 'images/my-hero-academia.png', categoryId: getCatId('Học Đường') },
            { name: 'Sword Art Online - Tập 1', authorName: 'Reki Kawahara', price: 35000, sold: 2900, imageUrl: 'images/sao.png', categoryId: getCatId('Xuyên Không') },
            { name: 'Uzumaki - Vòng Xoắn Ốc', authorName: 'Junji Ito', price: 50000, discount: '-10%', sold: 800, imageUrl: 'images/uzumaki.png', categoryId: getCatId('Kinh Dị') },
            { name: 'Gintama - Tập 1', authorName: 'Hideaki Sorachi', price: 25000, sold: 2200, imageUrl: 'images/gintama.png', categoryId: getCatId('Hài Hước') },
            { name: 'Haikyuu!! - Tập 10', authorName: 'Haruichi Furudate', price: 30000, sold: 4100, imageUrl: 'images/haikyuu.png', categoryId: getCatId('Thể Thao') },
            { name: 'Ghost in the Shell', authorName: 'Masamune Shirow', price: 55000, sold: 600, imageUrl: 'images/ghost-in-shell.png', categoryId: getCatId('Khoa Học Viễn Tưởng') },
            { name: 'Attack on Titan - Tập 34', authorName: 'Hajime Isayama', price: 35000, discount: '-20%', sold: 4800, imageUrl: 'images/attack-on-titan.png', categoryId: getCatId('Giả Tưởng') },
            { name: 'Hunter x Hunter - Tập 32', authorName: 'Yoshihiro Togashi', price: 25000, sold: 1900, imageUrl: 'images/hunter-x-hunter.png', categoryId: getCatId('Phiêu Lưu') },
            { name: 'Spy x Family - Tập 1', authorName: 'Tatsuya Endo', price: 35000, discount: '-10%', sold: 4200, imageUrl: 'images/spy-x-family.png', categoryId: getCatId('Đời Thường') },
            { name: 'Vương Giả Thiên Hạ', authorName: 'Yasuhisa Hara', price: 32000, sold: 1100, imageUrl: 'images/kingdom.png', categoryId: getCatId('Cổ Trang') },
            { name: 'Vinland Saga - Tập 1', authorName: 'Makoto Yukimura', price: 38000, sold: 1300, imageUrl: 'images/vinland-saga.png', categoryId: getCatId('Lịch Sử') },
            { name: 'Death Note - Cuốn Sổ Tử Thần', authorName: 'Tsugumi Ohba', price: 30000, discount: '-20%', sold: 2500, imageUrl: 'images/death-note.png', categoryId: getCatId('Tâm Lý') },
            { name: 'Fairy Tail - Tập 10', authorName: 'Hiro Mashima', price: 20000, sold: 5100, imageUrl: 'images/fairy-tail.png', categoryId: getCatId('Phép Thuật') },
            { name: 'Neon Genesis Evangelion', authorName: 'Yoshiyuki Sadamoto', price: 40000, sold: 900, imageUrl: 'images/evangelion.png', categoryId: getCatId('Mecha') },
            { name: 'Vua Bếp Soma - Tập 1', authorName: 'Yuto Tsukuda', price: 25000, discount: '-5%', sold: 1700, imageUrl: 'images/soma.png', categoryId: getCatId('Nấu Ăn') },
            { name: 'Tháng Tư Là Lời Nói Dối Của Em', authorName: 'Naoshi Arakawa', price: 35000, sold: 2400, imageUrl: 'images/your-lie-in-april.png', categoryId: getCatId('Âm Nhạc') }
        ]);
        console.log("✅ Đã tạo dữ liệu Thể loại và Truyện tranh mẫu!");

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