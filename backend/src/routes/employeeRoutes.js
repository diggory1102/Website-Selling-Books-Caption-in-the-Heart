const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.get('/all', employeeController.getEmployees);
router.post('/add', employeeController.addEmployee);
router.delete('/delete/:id', employeeController.deleteEmployee);

module.exports = router;
