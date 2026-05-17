// backend/routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promotionController');

// Tạo các đường dẫn API
router.post('/add', promoController.addPromotion);
router.get('/all', promoController.getAllPromotions);
router.delete('/delete/:id', promoController.deletePromotion);
router.post('/validate', promoController.validateVoucher);
router.get('/available', promoController.getAvailableVouchers);
router.post('/apply', promoController.applyVoucher);

module.exports = router;
