const { Bill, Rate, Product } = require('../models/database');

// Lấy danh sách sản phẩm chưa đánh giá từ các đơn hàng Đã giao
const getReviewableProducts = async (req, res) => {
    try {
        const userId = req.params.userId;
        const completedOrders = await Bill.find({ userId: userId, status: 'Đã giao' }).populate('items.productId');
        
        // Lấy tất cả các đánh giá user này đã thực hiện
        const reviewedRates = await Rate.find({ userId: userId });
        
        // Tập hợp các sản phẩm đã đánh giá không kèm billId (để tương thích ngược)
        const legacyReviewedProductIds = reviewedRates
            .filter(r => !r.billId)
            .map(r => r.productId.toString());
            
        // Tập hợp các cặp billId_productId đã đánh giá
        const reviewedBillProductPairs = new Set(
            reviewedRates
                .filter(r => r.billId)
                .map(r => `${r.billId.toString()}_${r.productId.toString()}`)
        );
        
        let reviewableItems = [];

        completedOrders.forEach(order => {
            let addedProductIdsForThisOrder = new Set();
            order.items.forEach(item => {
                if (item.productId) {
                    const pIdStr = item.productId._id.toString();
                    const pairStr = `${order._id.toString()}_${pIdStr}`;
                    
                    const isReviewed = reviewedBillProductPairs.has(pairStr) || legacyReviewedProductIds.includes(pIdStr);
                    
                    if (!isReviewed && !addedProductIdsForThisOrder.has(pIdStr)) {
                        reviewableItems.push({
                            productId: item.productId._id,
                            productName: item.productName,
                            imageUrl: item.productId.imageUrl,
                            orderDate: order.createdAt,
                            billId: order._id
                        });
                        addedProductIdsForThisOrder.add(pIdStr);
                    }
                }
            });
        });

        res.json({ success: true, items: reviewableItems });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi lấy danh sách đánh giá" }); }
};

// Gửi đánh giá mới
const submitReview = async (req, res) => {
    try {
        const { userId, productId, billId, rating, content } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Vui lòng chọn số sao hợp lệ!" });

        let existingReview = null;
        if (billId) {
            existingReview = await Rate.findOne({ userId, billId, productId });
        } else {
            existingReview = await Rate.findOne({ userId, productId });
        }
        
        if (existingReview) return res.status(400).json({ success: false, message: "Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi!" });

        await Rate.create({ userId, productId, billId, rating, content, status: 'Đã duyệt' });

        const allProductRates = await Rate.find({ productId });
        const totalReviews = allProductRates.length;
        const avgRating = allProductRates.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

        await Product.findByIdAndUpdate(productId, { totalReviews: totalReviews, averageRating: avgRating });
        res.json({ success: true, message: "Đánh giá thành công! Cảm ơn bạn." });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi gửi đánh giá" }); }
};

// Lấy danh sách đánh giá của 1 sản phẩm
const getProductReviews = async (req, res) => {
    try {
        const reviews = await Rate.find({ productId: req.params.productId, status: 'Đã duyệt' })
            .populate('userId', 'fullName userName')
            .sort({ createdAt: -1 }); // Mới nhất xếp lên đầu
        res.json({ success: true, reviews });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi tải đánh giá" }); }
};

const getAllReviews = async (req, res) => {
    try {
        const reviews = await Rate.find()
            .populate('userId', 'fullName userName')
            .populate('productId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi lấy tất cả đánh giá" }); }
};

module.exports = { getReviewableProducts, submitReview, getProductReviews, getAllReviews };
