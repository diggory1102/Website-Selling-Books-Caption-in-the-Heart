const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/user/:userId', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/user/:userId/read-all', notificationController.markAllAsRead);

// Admin routes
router.get('/admin/all', notificationController.getAllNotifications);
router.post('/admin', notificationController.createSystemNotification);
router.delete('/admin/:id', notificationController.deleteNotification);

module.exports = router;