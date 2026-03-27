const { Notification } = require('../database');

// Lấy danh sách thông báo của User
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
        let notifications = await Notification.find({
            $or: [{ userId: userId }, { userId: null }]
        }).sort({ createdAt: -1 }); // Mới nhất lên đầu
        
        // Tự động tạo 1 thông báo chào mừng nếu user chưa có gì để giao diện không bị trống
        if (notifications.length === 0) {
            const welcomeNoti = await Notification.create({
                userId: userId, title: '🎉 Chào mừng bạn đến với Caption In The Heart!',
                content: 'Cảm ơn bạn đã tham gia cộng đồng yêu truyện tranh. Hãy bắt đầu khám phá và mua sắm những bộ truyện hot nhất nhé!',
                type: 'SYSTEM'
            });
            notifications.push(welcomeNoti);
        }
        
        res.json({ success: true, notifications });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi Server khi tải thông báo" }); }
};

// Đánh dấu 1 thông báo đã đọc
const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};

// Đánh dấu tất cả đã đọc
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
        res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
    } catch (error) { res.status(500).json({ success: false }); }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead };