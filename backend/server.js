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
app.use(cors({
    origin: '*', // Cho phép mọi nguồn (Frontend) truy cập
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Cho phép các phương thức
    allowedHeaders: ['Content-Type', 'Authorization']
})); 
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


// API Tìm kiếm thông minh
app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; 
        if (!keyword) return res.json([]); 

        // 1. In ra từ khóa để xem Frontend có gửi lên đúng không
        console.log(`\n👉 Đang tìm kiếm từ khóa: "${keyword}"`); 

        let pool = await sql.connect(dbConfig);
        
        let result = await pool.request()
            .input('keyword', sql.NVarChar, `%${keyword}%`) 
            .query(`
                SELECT TOP 5 
                    p.id, 
                    p.name AS productName, 
                    p.price, 
                    p.imageUrl, 
                    a.name AS authorName
                FROM Product p
                LEFT JOIN Author a ON p.authorId = a.id
                WHERE p.name LIKE @keyword 
                   OR a.name LIKE @keyword
            `);
            
        // 2. In ra số lượng kết quả tìm được từ SQL
        console.log(`✅ Đã tìm thấy: ${result.recordset.length} kết quả từ Database.`); 
        
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Lỗi SQL khi tìm kiếm:", err);
        res.status(500).send("Lỗi máy chủ khi tìm kiếm");
    }
});

// 5. Bật máy chủ lắng nghe
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🌐 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`===========================================\n`);
});


// API Tìm kiếm thông minh (Tên truyện hoặc Tên tác giả)
app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; // Lấy từ khóa từ Frontend gửi lên
        if (!keyword) return res.json([]); // Nếu không gõ gì thì trả về mảng rỗng

        let pool = await sql.connect(dbConfig);
        
        // Dùng LIKE '%từ_khóa%' để tìm kiếm chứa chuỗi
        // Dùng tham số @keyword để chống hack (SQL Injection)
        let result = await pool.request()
            .input('keyword', sql.NVarChar, `%${keyword}%`)
            .query(`
                SELECT TOP 5 p.id, p.name AS productName, p.price, p.imageUrl, a.name AS authorName
                FROM Product p
                LEFT JOIN Author a ON p.authorId = a.id
                WHERE p.name LIKE @keyword OR a.name LIKE @keyword
            `);
            
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
        res.status(500).send("Lỗi máy chủ khi tìm kiếm");
    }
});

// API lấy danh sách tất cả thể loại
app.get('/api/categories', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query("SELECT id, name FROM Categories ORDER BY name ASC");
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
        res.status(500).send("Lỗi Server");
    }
});