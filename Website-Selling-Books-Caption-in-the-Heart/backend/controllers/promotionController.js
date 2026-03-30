// backend/controllers/promotionController.js
const { Promotion } = require('../database'); // Quan trọng: Phải import model từ database.js

exports.addPromotion = async (req, res) => {
    try {
        const newPromo = new Promotion(req.body); 
        await newPromo.save(); // Lưu thực sự vào MongoDB
        res.status(201).json({ message: "Thêm khuyến mãi thành công!", data: newPromo });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi lưu", error });
    }
};

exports.getAllPromotions = async (req, res) => {
    try {
        const promos = await Promotion.find().sort({ createdAt: -1 }); // Lấy dữ liệu mới nhất lên đầu
        res.status(200).json(promos);
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi lấy dữ liệu", error });
    }
};
