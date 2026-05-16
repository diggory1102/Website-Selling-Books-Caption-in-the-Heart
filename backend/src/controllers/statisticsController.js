const { Bill, Product, User } = require('../models/database');

const getDashboardStats = async (req, res) => {
    try {
        const orders = await Bill.find();
        const products = await Product.countDocuments();
        const users = await User.countDocuments();

        // 1. Total Revenue (Completed only)
        const totalRevenue = orders
            .filter(o => o.status === 'Đã giao')
            .reduce((sum, o) => sum + o.totalPrice, 0);

        // 2. Orders Status Distribution
        const statusDistribution = {
            'Chờ xử lý': 0,
            'Đang giao': 0,
            'Đã giao': 0,
            'Đã hủy': 0
        };
        orders.forEach(o => {
            if (statusDistribution[o.status] !== undefined) {
                statusDistribution[o.status]++;
            }
        });

        // 3. Revenue for last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            
            const dayEnd = new Date(d);
            dayEnd.setHours(23,59,59,999);

            const dayRevenue = orders
                .filter(o => o.status === 'Đã giao' && o.createdAt >= d && o.createdAt <= dayEnd)
                .reduce((sum, o) => sum + o.totalPrice, 0);

            last7Days.push({
                date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
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
            revenueChart: last7Days
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi lấy thống kê: " + err.message });
    }
};

module.exports = { getDashboardStats };
