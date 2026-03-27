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

module.exports = router;