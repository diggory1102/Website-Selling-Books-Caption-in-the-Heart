// Import các thư viện
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import file kết nối database (để nó chạy dòng log kiểm tra kết nối)
const db = require('./config/db');

// Khởi tạo ứng dụng Express
const app = express();

// Cài đặt Middleware
app.use(cors()); // Cho phép Frontend (HTML) gọi API tới Backend
app.use(express.json()); // Cho phép Backend đọc dữ liệu dạng JSON (ví dụ form đăng nhập)

// Tạo một API thử nghiệm đầu tiên
app.get('/', (req, res) => {
    res.send("🚀 Chào mừng đến với Backend của Caption In The Heart!");
});

// Định nghĩa cổng chạy máy chủ
const PORT = process.env.PORT || 5000;

// Bắt đầu bật máy chủ lắng nghe
app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🌐 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`===========================================\n`);
});