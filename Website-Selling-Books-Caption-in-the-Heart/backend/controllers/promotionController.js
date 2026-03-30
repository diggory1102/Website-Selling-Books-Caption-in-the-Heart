// backend/controllers/promotionController.js
exports.addPromotion = async (req, res) => {
    try {
        const promoData = req.body;
        console.log("Dữ liệu khuyến mãi mới:", promoData);
        // Tạm thời log ra, sau này bạn gọi database.js ở đây để lưu
        res.status(201).json({ message: "Thêm khuyến mãi thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống", error });
    }
};

exports.getAllPromotions = async (req, res) => {
    try {
        // Tạm thời trả về mảng rỗng, sau này lấy từ database
        res.status(200).json([]); 
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống", error });
    }
};
