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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/frontend/client';

// GOOGLE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login.html` }),
    (req, res) => {
        const userInfo = { id: req.user._id, userName: req.user.userName, fullName: req.user.fullName, role: req.user.roleId };
        const userStr = encodeURIComponent(JSON.stringify(userInfo));
        res.redirect(`${FRONTEND_URL}/index.html?socialUser=${userStr}`);
    }
);

// FACEBOOK
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: `${FRONTEND_URL}/login.html` }),
    (req, res) => {
        const userInfo = { id: req.user._id, userName: req.user.userName, fullName: req.user.fullName };
        const userStr = encodeURIComponent(JSON.stringify(userInfo));
        res.redirect(`${FRONTEND_URL}/index.html?socialUser=${userStr}`);
    }
);

module.exports = router;