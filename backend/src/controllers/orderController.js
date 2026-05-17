const { Bill, Payment, Delivery, Promotion } = require('../models/database');

const createOrder = async (req, res) => {
    try {
        const { userId, items, shippingInfo, paymentMethod, subTotal, shippingFee, totalPrice, promotionId, discountValue } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Giỏ hàng trống!" });

        const payment = await Payment.create({ method: paymentMethod, status: 'Chưa thanh toán' });
        const delivery = await Delivery.create({ unitName: 'Giao hàng tiêu chuẩn', status: 'Chờ lấy hàng' });
        const randomBillCode = 'HD-' + Math.floor(100000 + Math.random() * 900000);

        const billData = {
            billCode: randomBillCode, paymentId: payment._id, deliveryId: delivery._id,
            subTotal: subTotal, shippingFee: shippingFee, discountValue: discountValue || 0, totalPrice: totalPrice, status: 'Chờ xử lý',
            customerName: shippingInfo.name, name: shippingInfo.name,
            customerPhone: shippingInfo.phone, phone: shippingInfo.phone,
            shippingAddress: shippingInfo.address, address: shippingInfo.address, note: shippingInfo.note,
            expectedDeliveryDate: shippingInfo.expectedDeliveryDate,
            expectedDeliveryTime: shippingInfo.expectedDeliveryTime,
            items: items.map(item => ({ 
                productId: item.productId, productName: item.name, name: item.name,
                quantity: item.quantity, priceAtPurchase: item.price, price: item.price 
            }))
        };

        if (userId) billData.userId = userId;
        if (promotionId) billData.promotionId = promotionId;

        const newBill = await Bill.create(billData);

        if (promotionId) await Promotion.findByIdAndUpdate(promotionId, { $inc: { usedCount: 1 } });

        // Tự động tạo thông báo đặt hàng thành công
        try {
            if (userId) {
                const { Notification } = require('../models/database');
                await Notification.create({
                    userId: userId,
                    title: "🛍️ Đặt hàng thành công!",
                    content: `Đơn hàng #${newBill.billCode} trị giá ${newBill.totalPrice.toLocaleString()}đ của bạn đã được đặt thành công và đang chờ xử lý.`,
                    type: "ORDER"
                });
            }
        } catch (notiError) {
            console.error("Lỗi khi tự động tạo thông báo đặt hàng:", notiError);
        }

        res.json({ success: true, message: "Đặt hàng thành công!", orderId: newBill._id });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi tạo đơn hàng: " + err.message }); }
};

const getUserOrders = async (req, res) => {
    try {
        const bills = await Bill.find({ userId: req.params.userId })
            .populate('paymentId').populate('deliveryId').populate('items.productId', 'imageUrl')
            .sort({ createdAt: -1 }); 
        res.json({ success: true, orders: bills });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" }); }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Bill.findById(req.params.id)
            .populate('paymentId').populate('deliveryId').populate('items.productId', 'imageUrl name');
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi lấy chi tiết đơn hàng" }); }
};

const cancelOrder = async (req, res) => {
    try {
        const order = await Bill.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        if (order.status !== 'Chờ xử lý') return res.status(400).json({ success: false, message: "Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý" });

        order.status = 'Đã hủy';
        await order.save();

        // Tự động tạo thông báo hủy đơn hàng
        try {
            if (order.userId) {
                const { Notification } = require('../models/database');
                await Notification.create({
                    userId: order.userId,
                    title: "❌ Hủy đơn hàng thành công",
                    content: `Đơn hàng #${order.billCode} của bạn đã được hủy thành công theo yêu cầu.`,
                    type: "ORDER"
                });
            }
        } catch (notiError) {
            console.error("Lỗi khi tự động tạo thông báo hủy đơn:", notiError);
        }

        res.json({ success: true, message: "Đã hủy đơn hàng thành công!" });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi khi hủy đơn hàng: " + err.message }); }
};

const getAllOrders = async (req, res) => {
    try {
        const bills = await Bill.find()
            .populate('paymentId').populate('deliveryId').populate('items.productId', 'imageUrl name')
            .sort({ createdAt: -1 }); // Lấy đơn hàng mới nhất lên đầu
        res.json({ success: true, orders: bills });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi lấy danh sách tất cả đơn hàng" }); }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Bill.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

        // Tự động tạo thông báo cập nhật trạng thái đơn hàng
        try {
            if (order.userId) {
                const { Notification } = require('../models/database');
                let emoji = '📦';
                let statusText = status;
                
                if (status === 'Đang giao') {
                    emoji = '🚚';
                    statusText = 'đang được vận chuyển đến bạn';
                } else if (status === 'Đã giao') {
                    emoji = '✅';
                    statusText = 'đã giao thành công. Chúc bạn đọc truyện vui vẻ';
                } else if (status === 'Đã hủy') {
                    emoji = '❌';
                    statusText = 'đã bị hủy';
                }

                await Notification.create({
                    userId: order.userId,
                    title: `${emoji} Cập nhật đơn hàng #${order.billCode}`,
                    content: `Đơn hàng của bạn ${statusText}.`,
                    type: "ORDER"
                });
            }
        } catch (notiError) {
            console.error("Lỗi khi tự động tạo thông báo cập nhật trạng thái đơn:", notiError);
        }

        res.json({ success: true, message: "Cập nhật trạng thái thành công!", order });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái: " + err.message }); }
};

module.exports = {
    createOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus
};
