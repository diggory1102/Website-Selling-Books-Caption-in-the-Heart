const { Bill, Product, User } = require('../models/database');

const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            
            // Kiểm tra ngày hợp lệ, nếu không hợp lệ thì gán mặc định 7 ngày qua
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                start = new Date();
                start.setDate(start.getDate() - 6);
                end = new Date();
            }
            
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else {
            // Mặc định 7 ngày qua
            start = new Date();
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            
            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        // Lấy các đơn hàng được tạo trong khoảng thời gian chọn
        const orders = await Bill.find({
            createdAt: { $gte: start, $lte: end }
        });
        
        const products = await Product.countDocuments();
        const users = await User.countDocuments();

        // 1. Tổng doanh thu trong kỳ (Chỉ các đơn Đã giao hoặc Đã nhận được hàng)
        const totalRevenue = orders
            .filter(o => o.status === 'Đã giao' || o.status === 'Đã nhận được hàng')
            .reduce((sum, o) => sum + o.totalPrice, 0);

        // 2. Phân bố trạng thái đơn hàng trong kỳ
        const statusDistribution = {
            'Chờ thanh toán': 0,
            'Chờ xử lý': 0,
            'Đang giao': 0,
            'Đã giao': 0,
            'Đã nhận được hàng': 0,
            'Đã hủy': 0
        };
        orders.forEach(o => {
            if (statusDistribution[o.status] !== undefined) {
                statusDistribution[o.status]++;
            }
        });

        // 3. Doanh thu theo từng ngày trong kỳ
        const revenueChart = [];
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        for (let i = 0; i < diffDays; i++) {
            const currentDay = new Date(start);
            currentDay.setDate(start.getDate() + i);
            
            const currentDayEnd = new Date(currentDay);
            currentDayEnd.setHours(23, 59, 59, 999);

            const dayRevenue = orders
                .filter(o => (o.status === 'Đã giao' || o.status === 'Đã nhận được hàng') && o.createdAt >= currentDay && o.createdAt <= currentDayEnd)
                .reduce((sum, o) => sum + o.totalPrice, 0);

            revenueChart.push({
                date: currentDay.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                revenue: dayRevenue
            });
        }

        res.json({
            success: true,
            summary: {
                totalRevenue,
                totalOrders: orders.length,
                totalProducts: products,
                totalUsers: users
            },
            statusDistribution,
            revenueChart
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi lấy thống kê: " + err.message });
    }
};

module.exports = { getDashboardStats };
