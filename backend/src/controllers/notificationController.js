const { Notification } = require('../models/database');

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

// ==========================================
// ADMIN APIS
// ==========================================

// Lấy toàn bộ thông báo trong hệ thống
const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().populate('userId', 'email userName fullName').sort({ createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi Server khi tải danh sách thông báo" }); }
};

// Admin chủ động tạo thông báo mới
const createSystemNotification = async (req, res) => {
    try {
        const { title, content, type, userId } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ success: false, message: "Vui lòng điền tiêu đề và nội dung thông báo!" });
        }

        const newNoti = await Notification.create({
            title, 
            content, 
            type: type || 'SYSTEM', 
            userId: userId || null
        });

        res.json({ success: true, message: "Đã phát hành thông báo thành công!", notification: newNoti });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi Server khi tạo thông báo" }); }
};

// Admin xóa thông báo
const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Đã thu hồi/xóa thông báo thành công!" });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi Server khi xóa thông báo" }); }
};

module.exports = { 
    getUserNotifications, markAsRead, markAllAsRead,
    getAllNotifications, createSystemNotification, deleteNotification
};
