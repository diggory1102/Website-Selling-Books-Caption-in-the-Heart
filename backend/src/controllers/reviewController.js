const { Bill, Rate, Product } = require('../models/database');

// Lấy danh sách sản phẩm chưa đánh giá từ các đơn hàng Đã giao
const getReviewableProducts = async (req, res) => {
    try {
        const userId = req.params.userId;
        const completedOrders = await Bill.find({ userId: userId, status: { $in: ['Đã giao', 'Đã nhận được hàng'] } }).populate('items.productId');
        
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

        const allProductRates = await Rate.find({ productId, status: 'Đã duyệt' });
        const totalReviews = allProductRates.length;
        const avgRating = totalReviews > 0 ? (allProductRates.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0;

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, rating, replied } = req.query;

        let filter = {};

        if (rating) {
            filter.rating = parseInt(rating);
        }

        if (replied === 'true') {
            filter.adminReply = { $ne: '', $exists: true };
        } else if (replied === 'false') {
            filter.$or = [
                { adminReply: '' },
                { adminReply: { $exists: false } }
            ];
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            
            // Tìm User khớp search
            const matchedUsers = await Rate.db.model('User').find({
                $or: [
                    { userName: regex },
                    { fullName: regex },
                    { email: regex }
                ]
            }).select('_id');
            const userIds = matchedUsers.map(u => u._id);

            // Tìm Product khớp search
            const matchedProducts = await Rate.db.model('Product').find({
                name: regex
            }).select('_id');
            const productIds = matchedProducts.map(p => p._id);

            filter.$or = [
                { userId: { $in: userIds } },
                { productId: { $in: productIds } },
                { content: regex }
            ];
        }

        const totalReviews = await Rate.countDocuments(filter);

        const reviews = await Rate.find(filter)
            .populate('userId', 'fullName userName email')
            .populate('productId', 'name')
            .populate('billId', 'billCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalReviews / limit);

        // Tính các chỉ số thống kê tổng quan (cho tất cả đánh giá)
        const overallTotal = await Rate.countDocuments();
        const positiveCount = await Rate.countDocuments({ rating: { $gte: 4 } });
        const negativeCount = await Rate.countDocuments({ rating: { $lte: 2 } });

        res.json({
            success: true,
            reviews,
            currentPage: page,
            totalPages,
            totalReviews,
            stats: {
                total: overallTotal,
                positive: positiveCount,
                negative: negativeCount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lấy tất cả đánh giá" });
    }
};

// Phản hồi đánh giá
const replyReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { replyContent } = req.body;

        const review = await Rate.findByIdAndUpdate(
            reviewId,
            { adminReply: replyContent, repliedAt: new Date() },
            { new: true }
        );

        if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });

        res.json({ success: true, message: "Đã gửi phản hồi thành công!", review });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi phản hồi đánh giá" });
    }
};

// Cập nhật trạng thái đánh giá (Ẩn/Hiện)
const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body; // 'Đã duyệt' hoặc 'Đã ẩn'

        const review = await Rate.findByIdAndUpdate(
            reviewId,
            { status },
            { new: true }
        );

        if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });

        // Cập nhật lại số lượng và trung bình sao của sản phẩm (chỉ tính những đánh giá 'Đã duyệt')
        const productId = review.productId;
        const allProductRates = await Rate.find({ productId, status: 'Đã duyệt' });
        const totalReviews = allProductRates.length;
        const avgRating = totalReviews > 0 ? (allProductRates.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0;

        await Product.findByIdAndUpdate(productId, { totalReviews: totalReviews, averageRating: avgRating });

        res.json({ success: true, message: `Đã cập nhật trạng thái thành: ${status}`, review });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
    }
};

// Xóa vĩnh viễn đánh giá
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await Rate.findById(reviewId);
        if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });

        const productId = review.productId;

        await Rate.findByIdAndDelete(reviewId);

        // Cập nhật lại số lượng và trung bình sao của sản phẩm
        const allProductRates = await Rate.find({ productId, status: 'Đã duyệt' });
        const totalReviews = allProductRates.length;
        const avgRating = totalReviews > 0 ? (allProductRates.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0;

        await Product.findByIdAndUpdate(productId, { totalReviews: totalReviews, averageRating: avgRating });

        res.json({ success: true, message: "Đã xóa đánh giá vĩnh viễn!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi xóa đánh giá" });
    }
};

module.exports = { getReviewableProducts, submitReview, getProductReviews, getAllReviews, replyReview, updateReviewStatus, deleteReview };
