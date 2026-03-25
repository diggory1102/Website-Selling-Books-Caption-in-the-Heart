const { User, Bill } = require('../database');
const bcrypt = require('bcryptjs'); // Thêm thư viện mã hóa mật khẩu

// Lấy thông tin hồ sơ kèm theo THỐNG KÊ HẠNG THÀNH VIÊN
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        // TÍNH TOÁN THÀNH TÍCH VÀ HẠNG THÀNH VIÊN
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        
        // Lấy tất cả đơn hàng Đã giao của khách này
        const completedOrders = await Bill.find({ userId: req.params.id, status: 'Đã giao' });

        let totalSpentAllTime = 0;
        let quarterOrderCount = 0;
        let quarterSpent = 0;

        completedOrders.forEach(order => {
            totalSpentAllTime += order.totalPrice;
            
            const orderDate = new Date(order.createdAt);
            const orderYear = orderDate.getFullYear();
            const orderQuarter = Math.floor(orderDate.getMonth() / 3) + 1;

            // Nếu đơn hàng rơi vào quý hiện tại
            if (orderYear === currentYear && orderQuarter === currentQuarter) {
                quarterOrderCount++;
                quarterSpent += order.totalPrice;
            }
        });

        // Xếp hạng: Mới (0), Đồng (500k), Bạc (2tr), Vàng (5tr), Kim Cương (10tr)
        let tier = 'Thành viên Mới';
        if (totalSpentAllTime >= 10000000) tier = 'Kim Cương';
        else if (totalSpentAllTime >= 5000000) tier = 'Vàng';
        else if (totalSpentAllTime >= 2000000) tier = 'Bạc';
        else if (totalSpentAllTime >= 500000) tier = 'Đồng';

        res.json({ success: true, user, stats: { tier, currentQuarter, quarterOrderCount, quarterSpent } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// Cập nhật thông tin hồ sơ
const updateUserProfile = async (req, res) => {
    try {
        const { fullName, numberPhone, email, dateOfBirth, defaultAddress, avatar } = req.body;
        const userId = req.params.id;

        // Kiểm tra xem email muốn đổi có bị trùng với người khác không
        if (email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: "Email này đã được tài khoản khác sử dụng!" });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, numberPhone, email, dateOfBirth, defaultAddress, avatar },
            { new: true } // Trả về document mới sau khi cập nhật
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        res.json({ success: true, message: "Cập nhật hồ sơ thành công!", user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// ==========================================
// ĐỒNG BỘ GIỎ HÀNG
// ==========================================
const syncCart = async (req, res) => {
    try {
        const { cart } = req.body;
        const userId = req.params.id;
        
        await User.findByIdAndUpdate(userId, { cart: cart });
        res.json({ success: true, message: "Đã đồng bộ giỏ hàng lên Server" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi đồng bộ giỏ hàng" });
    }
};

const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        res.json({ success: true, cart: user.cart || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// ==========================================
// ĐỔI MẬT KHẨU
// ==========================================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng!" });

        // Mã hóa mật khẩu mới và lưu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server khi đổi mật khẩu" });
    }
};

// ==========================================
// QUẢN LÝ SỔ ĐỊA CHỈ
// ==========================================
const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        const newAddress = req.body;
        if (user.addresses.length === 0) newAddress.isDefault = true;
        else if (newAddress.isDefault) user.addresses.forEach(a => a.isDefault = false);

        user.addresses.push(newAddress);
        await user.save();
        res.json({ success: true, message: "Thêm địa chỉ thành công!", addresses: user.addresses });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi thêm địa chỉ" }); }
};

const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        const addressId = req.params.addressId;
        const updatedData = req.body;

        if (updatedData.isDefault) user.addresses.forEach(a => a.isDefault = false);

        const addressIndex = user.addresses.findIndex(a => a._id.toString() === addressId);
        if (addressIndex > -1) {
            user.addresses[addressIndex] = { ...user.addresses[addressIndex].toObject(), ...updatedData };
            await user.save();
            res.json({ success: true, message: "Cập nhật địa chỉ thành công!", addresses: user.addresses });
        } else res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ" });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi cập nhật địa chỉ" }); }
};

const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
        if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) user.addresses[0].isDefault = true;

        await user.save();
        res.json({ success: true, message: "Đã xóa địa chỉ!", addresses: user.addresses });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi xóa địa chỉ" }); }
};

const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        user.addresses.forEach(a => a.isDefault = (a._id.toString() === req.params.addressId));
        await user.save();
        res.json({ success: true, message: "Đã đặt làm mặc định!", addresses: user.addresses });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi thiết lập mặc định" }); }
};

module.exports = { getUserProfile, updateUserProfile, syncCart, getCart, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress };