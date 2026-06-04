const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.post('/:id/cart', userController.syncCart);
router.get('/:id/cart', userController.getCart);
router.put('/:id/password', userController.changePassword);

router.post('/:id/addresses', userController.addAddress);
router.put('/:id/addresses/:addressId', userController.updateAddress);
router.delete('/:id/addresses/:addressId', userController.deleteAddress);
router.put('/:id/addresses/:addressId/default', userController.setDefaultAddress);

// Middleware chặn truy cập trái phép của nhân viên (staff)
const adminOnly = (req, res, next) => {
    const role = req.headers['x-role'];
    if (role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Truy cập bị từ chối! Quyền hạn không đủ." });
    }
};

// Admin routes
router.get('/admin/all', userController.getAllUsers);
router.get('/admin/search', userController.searchUsers);
router.put('/admin/toggle-status/:id', adminOnly, userController.toggleUserStatus);

module.exports = router;