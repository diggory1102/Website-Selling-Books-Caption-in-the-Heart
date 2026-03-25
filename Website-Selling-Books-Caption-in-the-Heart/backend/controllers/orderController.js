const { Bill, Payment, Delivery, Promotion } = require('../database');

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
            items: items.map(item => ({ 
                productId: item.productId, productName: item.name, name: item.name,
                quantity: item.quantity, priceAtPurchase: item.price, price: item.price 
            }))
        };

        if (userId) billData.userId = userId;
        if (promotionId) billData.promotionId = promotionId;

        const newBill = await Bill.create(billData);

        if (promotionId) await Promotion.findByIdAndUpdate(promotionId, { $inc: { usedCount: 1 } });
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
        res.json({ success: true, message: "Đã hủy đơn hàng thành công!" });
    } catch (err) { res.status(500).json({ success: false, message: "Lỗi khi hủy đơn hàng: " + err.message }); }
};

module.exports = {
    createOrder, getUserOrders, getOrderById, cancelOrder
};