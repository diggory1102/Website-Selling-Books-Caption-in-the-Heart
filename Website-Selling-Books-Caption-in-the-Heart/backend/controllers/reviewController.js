const { Bill, Rate, Product } = require('../database');

// Lấy danh sách sản phẩm chưa đánh giá từ các đơn hàng Đã giao
const getReviewableProducts = async (req, res) => {
    try {
        const userId = req.params.userId;
        const completedOrders = await Bill.find({ userId: userId, status: 'Đã giao' }).populate('items.productId');
        
        // Lấy tất cả các sản phẩm user này đã đánh giá rồi
        const reviewedRates = await Rate.find({ userId: userId });
        const reviewedProductIds = reviewedRates.map(r => r.productId.toString());
        
        let reviewableItems = [];
        let addedProductIds = new Set();

        completedOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.productId && !reviewedProductIds.includes(item.productId._id.toString()) && !addedProductIds.has(item.productId._id.toString())) {
                    reviewableItems.push({
                        productId: item.productId._id, productName: item.productName,
                        imageUrl: item.productId.imageUrl, orderDate: order.createdAt
                    });
                    addedProductIds.add(item.productId._id.toString());
                }
            });
        });

        res.json({ success: true, items: reviewableItems });
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi lấy danh sách đánh giá" }); }
};

// Gửi đánh giá mới
const submitReview = async (req, res) => {
    try {
        const { userId, productId, rating, content } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Vui lòng chọn số sao hợp lệ!" });

        const existingReview = await Rate.findOne({ userId, productId });
        if (existingReview) return res.status(400).json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi!" });

        await Rate.create({ userId, productId, rating, content, status: 'Đã duyệt' });

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

module.exports = { getReviewableProducts, submitReview, getProductReviews };