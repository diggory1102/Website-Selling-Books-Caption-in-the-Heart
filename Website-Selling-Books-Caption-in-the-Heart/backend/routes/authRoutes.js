const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Các API xác thực bằng tài khoản gốc
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/admin-login', authController.adminLogin);

// ==========================================
// CÁC ĐƯỜNG DẪN XÁC THỰC QUA MẠNG XÃ HỘI
// ==========================================

// GOOGLE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://127.0.0.1:5500/login.html' }),
    (req, res) => {
        const userInfo = { id: req.user._id, userName: req.user.userName, fullName: req.user.fullName, role: req.user.roleId };
        const userStr = encodeURIComponent(JSON.stringify(userInfo));
        res.redirect(`http://127.0.0.1:5500/Website-Selling-Books-Caption-in-the-Heart/frontend/client/index.html?socialUser=${userStr}`);
    }
);

// FACEBOOK
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: 'http://127.0.0.1:5500/login.html' }),
    (req, res) => {
        const userInfo = { id: req.user._id, userName: req.user.userName, fullName: req.user.fullName };
        const userStr = encodeURIComponent(JSON.stringify(userInfo));
        res.redirect(`http://127.0.0.1:5500/index.html?socialUser=${userStr}`);
    }
);

module.exports = router;