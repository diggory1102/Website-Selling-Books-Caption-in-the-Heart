const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', updateOrderStatus);

// Route dành cho Admin lấy tất cả đơn hàng
router.get('/', getAllOrders);

module.exports = router;