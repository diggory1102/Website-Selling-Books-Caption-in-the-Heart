const { Bill, Payment, Delivery, Promotion } = require('../models/database');
const crypto = require('crypto');

const createOrder = async (req, res) => {
    try {
        const { userId, items, shippingInfo, paymentMethod, subTotal, shippingFee, totalPrice, promotionId, discountValue } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Giỏ hàng trống!" });

        const payment = await Payment.create({ method: paymentMethod, status: 'Chưa thanh toán' });
        const delivery = await Delivery.create({ unitName: 'Giao hàng tiêu chuẩn', status: 'Chờ lấy hàng' });
        const randomBillCode = 'HD-' + Math.floor(100000 + Math.random() * 900000);

        const billData = {
            billCode: randomBillCode, paymentId: payment._id, deliveryId: delivery._id,
            subTotal: subTotal, shippingFee: shippingFee, discountValue: discountValue || 0, totalPrice: totalPrice, 
            status: paymentMethod === 'VNPAY' ? 'Chờ thanh toán' : 'Chờ xử lý',
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
                let contentText = `Đơn hàng #${newBill.billCode} trị giá ${newBill.totalPrice.toLocaleString()}đ của bạn đã được đặt thành công và đang chờ xử lý.`;
                if (paymentMethod === 'VNPAY') {
                    contentText = `Đơn hàng #${newBill.billCode} trị giá ${newBill.totalPrice.toLocaleString()}đ của bạn đã được tạo và đang chờ thanh toán qua cổng VNPay.`;
                }
                await Notification.create({
                    userId: userId,
                    title: paymentMethod === 'VNPAY' ? "🛍️ Đơn hàng đang chờ thanh toán!" : "🛍️ Đặt hàng thành công!",
                    content: contentText,
                    type: "ORDER"
                });
            }
        } catch (notiError) {
            console.error("Lỗi khi tự động tạo thông báo đặt hàng:", notiError);
        }

        let vnpUrl = '';
        if (paymentMethod === 'VNPAY') {
            const ipAddr = req.headers['x-forwarded-for'] ||
                req.socket.remoteAddress ||
                req.ip ||
                '127.0.0.1';

            const tmnCode = process.env.VNP_TMN_CODE;
            const secretKey = process.env.VNP_HASH_SECRET;
            const vnpUrlBase = process.env.VNP_URL;
            const returnUrl = process.env.VNP_RETURN_URL;

            if (!tmnCode || !secretKey) {
                throw new Error("Chưa cấu hình VNPay trong file .env!");
            }

            const date = new Date();
            const createDate = getVnpayDateFormat(date);

            let vnp_Params = {
                'vnp_Version': '2.1.0',
                'vnp_Command': 'pay',
                'vnp_TmnCode': tmnCode,
                'vnp_Locale': 'vn',
                'vnp_CurrCode': 'VND',
                'vnp_TxnRef': newBill.billCode,
                'vnp_OrderInfo': 'Thanh toan don hang ' + newBill.billCode,
                'vnp_OrderType': 'other',
                'vnp_Amount': newBill.totalPrice * 100,
                'vnp_ReturnUrl': returnUrl,
                'vnp_IpAddr': ipAddr,
                'vnp_CreateDate': createDate
            };

            vnpUrl = generateVnpUrl(vnp_Params, secretKey, vnpUrlBase);
        }

        res.json({ success: true, message: "Đặt hàng thành công!", orderId: newBill._id, vnpUrl });
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

// ==========================================
// CÁC HÀM TIỆN ÍCH VNPAY
// ==========================================

function getVnpayDateFormat(date) {
    const tzOffset = 7 * 60; // Offset GMT+7 tính bằng phút
    const localTime = new Date(date.getTime() + tzOffset * 60 * 1000);
    const yyyy = localTime.getUTCFullYear();
    const mm = String(localTime.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(localTime.getUTCDate()).padStart(2, '0');
    const hh = String(localTime.getUTCHours()).padStart(2, '0');
    const min = String(localTime.getUTCMinutes()).padStart(2, '0');
    const ss = String(localTime.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

function generateVnpUrl(params, secretKey, baseUrl) {
    let sortedParams = {};
    let keys = Object.keys(params).sort();
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let val = params[key];
        if (val !== null && val !== undefined && val !== '') {
            sortedParams[key] = val;
        }
    }
    
    let signData = Object.keys(sortedParams)
        .map(key => {
            let val = sortedParams[key];
            return encodeURIComponent(key) + '=' + encodeURIComponent(val).replace(/%20/g, '+');
        })
        .join('&');

    const hmac = crypto.createHmac("sha512", secretKey);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    
    return baseUrl + '?' + signData + '&vnp_SecureHash=' + secureHash;
}

const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        let sortedParams = {};
        let keys = Object.keys(vnp_Params).sort();
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let val = vnp_Params[key];
            if (val !== null && val !== undefined && val !== '') {
                sortedParams[key] = val;
            }
        }

        let signData = Object.keys(sortedParams)
            .map(key => {
                let val = sortedParams[key];
                return encodeURIComponent(key) + '=' + encodeURIComponent(val).replace(/%20/g, '+');
            })
            .join('&');

        const secretKey = process.env.VNP_HASH_SECRET;
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        const billCode = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];

        const bill = await Bill.findOne({ billCode });
        if (!bill) {
            return res.redirect(`${process.env.FRONTEND_URL}/orders.html?paymentStatus=failed&message=order_not_found`);
        }

        if (signed === secureHash) {
            if (responseCode === '00') {
                // Thanh toán thành công
                await Payment.findByIdAndUpdate(bill.paymentId, { status: 'Đã thanh toán' });
                bill.status = 'Chờ xử lý';
                await bill.save();
                
                try {
                    if (bill.userId) {
                        const { Notification } = require('../models/database');
                        await Notification.create({
                            userId: bill.userId,
                            title: "💳 Thanh toán VNPay thành công!",
                            content: `Đơn hàng #${bill.billCode} của bạn đã được thanh toán thành công qua cổng VNPay.`,
                            type: "ORDER"
                        });
                    }
                } catch (err) {
                    console.error("Lỗi tạo thông báo VNPay:", err);
                }

                return res.redirect(`${process.env.FRONTEND_URL}/order-detail.html?id=${bill._id}&paymentStatus=success&clearCart=true`);
            } else {
                // Thanh toán thất bại hoặc hủy bỏ
                await Payment.findByIdAndUpdate(bill.paymentId, { status: 'Thanh toán thất bại' });
                if (bill.status !== 'Đã hủy') {
                    bill.status = 'Đã hủy';
                    await bill.save();
                    if (bill.promotionId) {
                        await Promotion.findByIdAndUpdate(bill.promotionId, { $inc: { usedCount: -1 } });
                    }
                }
                return res.redirect(`${process.env.FRONTEND_URL}/checkout.html?paymentStatus=failed`);
            }
        } else {
            console.error("VNPay Signature Verification Failed!");
            if (bill.status !== 'Đã hủy') {
                bill.status = 'Đã hủy';
                await bill.save();
                if (bill.promotionId) {
                    await Promotion.findByIdAndUpdate(bill.promotionId, { $inc: { usedCount: -1 } });
                }
            }
            return res.redirect(`${process.env.FRONTEND_URL}/checkout.html?paymentStatus=failed&reason=checksum`);
        }
    } catch (err) {
        console.error("Lỗi vnpayReturn:", err);
        res.status(500).send("Có lỗi xảy ra trong quá trình xử lý giao dịch!");
    }
};

const vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        let sortedParams = {};
        let keys = Object.keys(vnp_Params).sort();
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let val = vnp_Params[key];
            if (val !== null && val !== undefined && val !== '') {
                sortedParams[key] = val;
            }
        }

        let signData = Object.keys(sortedParams)
            .map(key => {
                let val = sortedParams[key];
                return encodeURIComponent(key) + '=' + encodeURIComponent(val).replace(/%20/g, '+');
            })
            .join('&');

        const secretKey = process.env.VNP_HASH_SECRET;
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (signed === secureHash) {
            const billCode = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            const vnp_Amount = Number(vnp_Params['vnp_Amount']);

            const bill = await Bill.findOne({ billCode }).populate('paymentId');
            
            if (!bill) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }

            if (bill.totalPrice * 100 !== vnp_Amount) {
                return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
            }

            if (bill.paymentId && bill.paymentId.status === 'Đã thanh toán') {
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }

            if (responseCode === '00') {
                await Payment.findByIdAndUpdate(bill.paymentId, { status: 'Đã thanh toán' });
                bill.status = 'Chờ xử lý';
                await bill.save();
                
                try {
                    if (bill.userId) {
                        const { Notification } = require('../models/database');
                        const existingNoti = await Notification.findOne({
                            userId: bill.userId,
                            title: "💳 Thanh toán VNPay thành công!",
                            content: { $regex: bill.billCode }
                        });
                        if (!existingNoti) {
                            await Notification.create({
                                userId: bill.userId,
                                title: "💳 Thanh toán VNPay thành công!",
                                content: `Đơn hàng #${bill.billCode} của bạn đã được thanh toán thành công qua cổng VNPay.`,
                                type: "ORDER"
                            });
                        }
                    }
                } catch (err) {
                    console.error("Lỗi tạo thông báo VNPay IPN:", err);
                }

                return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            } else {
                await Payment.findByIdAndUpdate(bill.paymentId, { status: 'Thanh toán thất bại' });
                if (bill.status !== 'Đã hủy') {
                    bill.status = 'Đã hủy';
                    await bill.save();
                    if (bill.promotionId) {
                        await Promotion.findByIdAndUpdate(bill.promotionId, { $inc: { usedCount: -1 } });
                    }
                }
                return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            }
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        }
    } catch (err) {
        console.error("Lỗi vnpayIpn:", err);
        return res.status(200).json({ RspCode: '99', Message: 'Unknow error' });
    }
};

module.exports = {
    createOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus, vnpayReturn, vnpayIpn
};
