const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/categories', productController.getCategories);
router.get('/search', productController.searchProducts);
router.get('/products/best-sellers', productController.getBestSellers);
router.get('/products/newest', productController.getNewestProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/:id/related', productController.getRelatedProducts);

module.exports = router;