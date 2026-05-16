// backend/routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promotionController');

// Tạo các đường dẫn API
router.post('/add', promoController.addPromotion);
router.get('/all', promoController.getAllPromotions);
router.delete('/delete/:id', promoController.deletePromotion);

module.exports = router;
