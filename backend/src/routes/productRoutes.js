const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/categories', productController.getCategories);
router.get('/search', productController.searchProducts);
router.get('/all', productController.getAllProducts);
router.post('/add', productController.addProduct);
router.put('/update/:id', productController.updateProduct);
router.delete('/delete/:id', productController.deleteProduct);

router.get('/best-sellers', productController.getBestSellers);
router.get('/newest', productController.getNewestProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);

module.exports = router;