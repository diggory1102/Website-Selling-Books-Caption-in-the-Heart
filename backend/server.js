// 1. Import các thư viện
const express = require('express');
const cors = require('cors');
const sql = require('mssql'); // Thêm dòng này để dùng được biến 'sql'
require('dotenv').config();

// 2. Import cấu hình database từ file riêng
// Đảm bảo file ./config/db.js của bạn có export biến 'config'
const dbConfig = require('./config/db'); 

const app = express();

// 3. Cài đặt Middleware (Chỉ khai báo MỘT LẦN duy nhất)
app.use(cors()); 
app.use(express.json()); 

// 4. Các API Routes
// API thử nghiệm
app.get('/', (req, res) => {
    res.send("🚀 Chào mừng đến với Backend của Caption In The Heart!");
});

// API lấy sản phẩm Best Seller (Đã sửa lỗi kết nối)
app.get('/api/products/best-sellers', async (req, res) => {
    try {
        // Sử dụng dbConfig đã import ở trên
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .query('SELECT TOP 8 * FROM Product ORDER BY sold DESC'); 
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi SQL chi tiết:", err);
        res.status(500).send("Lỗi lấy dữ liệu từ SQL Server: " + err.message);
    }
});

// 5. Bật máy chủ lắng nghe
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🌐 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`===========================================\n`);
});