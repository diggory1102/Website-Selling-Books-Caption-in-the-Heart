const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/reviewable/:userId', reviewController.getReviewableProducts);
router.post('/submit', reviewController.submitReview);
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/all', reviewController.getAllReviews);

module.exports = router;