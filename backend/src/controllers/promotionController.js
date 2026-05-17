// backend/controllers/promotionController.js
const { Promotion, Bill } = require('../models/database');

// 1. Thêm mới khuyến mãi
exports.addPromotion = async (req, res) => {
    try {
        const data = req.body;
        // Xử lý targetValues nếu gửi lên từ UI
        if (typeof data.targetValues === 'string') {
            data.targetValues = data.targetValues.split(',').map(v => v.trim()).filter(v => v !== '');
        }

        const newPromo = new Promotion(data); 
        await newPromo.save();
        res.status(201).json({ success: true, message: "Thêm khuyến mãi thành công!", data: newPromo });
    } catch (error) {
        console.error("Lỗi addPromotion:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lưu", error: error.message });
    }
};

// 2. Lấy tất cả danh sách
exports.getAllPromotions = async (req, res) => {
    try {
        const promos = await Promotion.find().sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy dữ liệu", error });
    }
};

// 3. Xóa khuyến mãi
exports.deletePromotion = async (req, res) => {
    try {
        await Promotion.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Đã xóa mã khuyến mãi!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi xóa", error });
    }
};

// 4. Kiểm tra mã giảm giá (Đồng bộ với logic Membership có sẵn)
exports.validateVoucher = async (req, res) => {
    try {
        const { code, cartItems, subTotal, userId } = req.body;
        const promo = await Promotion.findOne({ code: code.toUpperCase(), status: 'ACTIVE', type: 'VOUCHER' });

        if (!promo) return res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại!" });

        const now = new Date();
        if (now < promo.startDate || now > promo.endDate) {
            return res.status(400).json({ success: false, message: "Mã giảm giá hiện không trong thời gian sử dụng!" });
        }

        if (promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng!" });
        }

        if (subTotal < promo.minOrderValue) {
            return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu để dùng mã này là ${promo.minOrderValue.toLocaleString()}đ` });
        }

        // --- ĐỒNG BỘ LOGIC MEMBERSHIP ---
        if (promo.applyTo === 'RANK' && userId) {
            // Lấy tất cả đơn hàng đã giao của khách để tính rank
            const completedOrders = await Bill.find({ userId, status: 'Đã giao' });
            let totalSpent = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

            let userTier = 'Thành viên Mới';
            if (totalSpent >= 10000000) userTier = 'Kim Cương';
            else if (totalSpent >= 5000000) userTier = 'Vàng';
            else if (totalSpent >= 2000000) userTier = 'Bạc';
            else if (totalSpent >= 500000) userTier = 'Đồng';

            // Kiểm tra xem hạng của user có nằm trong danh sách được phép không
            if (!promo.targetValues.includes(userTier)) {
                return res.status(400).json({ success: false, message: `Mã này chỉ dành cho hạng: ${promo.targetValues.join(', ')}. Bạn hiện đang là: ${userTier}` });
            }
        }

        res.json({ success: true, promotion: promo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi kiểm tra mã" });
    }
};

// 5. Lấy danh sách Voucher khả dụng cho Checkout
exports.getAvailableVouchers = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            type: 'VOUCHER',
            status: 'ACTIVE',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        // Định dạng dữ liệu tương thích với checkout.js
        const formatted = promotions.map(p => {
            const discountAmount = p.discountType === 'AMOUNT' ? p.discountValue : 0;
            const discountPercent = p.discountType === 'PERCENT' ? p.discountValue : 0;
            return {
                _id: p._id,
                id: p._id,
                code: p.code,
                discountAmount,
                discountPercent,
                minOrderValue: p.minOrderValue || 0,
                applyTo: p.applyTo,
                targetValues: p.targetValues
            };
        });

        res.json({ success: true, promotions: formatted });
    } catch (error) {
        console.error("Lỗi getAvailableVouchers:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách voucher khả dụng" });
    }
};

// 6. Áp dụng Voucher (Dành cho trang Checkout)
exports.applyVoucher = async (req, res) => {
    try {
        const { code, orderValue, userId } = req.body;
        
        if (!code) {
            return res.status(400).json({ success: false, message: "Thiếu mã giảm giá!" });
        }

        const promo = await Promotion.findOne({ code: code.toUpperCase(), status: 'ACTIVE', type: 'VOUCHER' });

        if (!promo) {
            return res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại hoặc đã bị khóa!" });
        }

        const now = new Date();
        if (now < promo.startDate || now > promo.endDate) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã hết hạn hoặc chưa tới ngày bắt đầu!" });
        }

        if (promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng!" });
        }

        if (orderValue < promo.minOrderValue) {
            return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu để áp dụng mã này là ${promo.minOrderValue.toLocaleString()}đ` });
        }

        // Kiểm tra Hạng thành viên (Rank)
        if (promo.applyTo === 'RANK') {
            if (!userId) {
                return res.status(400).json({ success: false, message: "Vui lòng đăng nhập để sử dụng mã ưu đãi dành riêng cho thành viên!" });
            }
            
            const completedOrders = await Bill.find({ userId, status: 'Đã giao' });
            let totalSpent = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

            let userTier = 'Thành viên Mới';
            if (totalSpent >= 10000000) userTier = 'Kim Cương';
            else if (totalSpent >= 5000000) userTier = 'Vàng';
            else if (totalSpent >= 2000000) userTier = 'Bạc';
            else if (totalSpent >= 500000) userTier = 'Đồng';

            if (!promo.targetValues.includes(userTier)) {
                return res.status(400).json({ success: false, message: `Mã giảm giá này chỉ dành cho thành viên hạng ${promo.targetValues.join(', ')}. Hạng hiện tại của bạn là: ${userTier}` });
            }
        }

        // Định dạng dữ liệu trả về tương thích với checkout.js
        const discountAmount = promo.discountType === 'AMOUNT' ? promo.discountValue : 0;
        const discountPercent = promo.discountType === 'PERCENT' ? promo.discountValue : 0;

        res.json({
            success: true,
            promotion: {
                _id: promo._id,
                id: promo._id,
                code: promo.code,
                discountAmount,
                discountPercent,
                minOrderValue: promo.minOrderValue || 0
            }
        });
    } catch (error) {
        console.error("Lỗi applyVoucher:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi áp dụng mã" });
    }
};
