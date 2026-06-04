const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Middleware chặn truy cập trái phép của nhân viên (staff)
const adminOnly = (req, res, next) => {
    const role = req.headers['x-role'];
    if (role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Truy cập bị từ chối! Quyền hạn không đủ." });
    }
};

router.get('/all', employeeController.getEmployees);
router.post('/add', adminOnly, employeeController.addEmployee);
router.delete('/delete/:id', adminOnly, employeeController.deleteEmployee);

module.exports = router;
