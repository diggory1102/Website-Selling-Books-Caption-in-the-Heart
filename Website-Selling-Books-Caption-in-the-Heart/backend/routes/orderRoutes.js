const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders } = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// Route dành cho Admin lấy tất cả đơn hàng
router.get('/', getAllOrders);

module.exports = router;