const express = require('express');
const cors = require('cors');
const sql = require('mssql'); 
require('dotenv').config();

// Chỉ cần nạp file db.js để nó tự động mở kết nối (Không cần gán biến)
require('./config/db'); 

const app = express();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization']
})); 
app.use(express.json()); 

app.get('/', (req, res) => {
    res.send("🚀 Chào mừng đến với Backend của Caption In The Heart!");
});

// 1. API Lấy Danh Mục
app.get('/api/categories', async (req, res) => {
    try {
        // Dùng trực tiếp hàm query của sql (Global Connection)
        let result = await sql.query("SELECT id, name FROM Category ORDER BY name ASC");
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
        res.status(500).send("Lỗi Server");
    }
});

// 2. API Lấy Best Sellers
app.get('/api/products/best-sellers', async (req, res) => {
    try {
        let result = await sql.query('SELECT TOP 8 * FROM Product ORDER BY sold DESC'); 
        res.json(result.recordset);
    } catch (err) {
        console.error("Lỗi SQL chi tiết (Best Seller):", err);
        res.status(500).send("Lỗi lấy dữ liệu từ SQL Server");
    }
});

// 3. API Tìm Kiếm
app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; 
        if (!keyword) return res.json([]); 

        console.log(`\n👉 Đang tìm kiếm từ khóa: "${keyword}"`); 

        // Tạo Request trực tiếp để truyền tham số chống hack
        let request = new sql.Request();
        request.input('keyword', sql.NVarChar, `%${keyword}%`);
        let result = await request.query(`
                SELECT TOP 5 p.id, p.name AS productName, p.price, p.imageUrl, a.name AS authorName
                FROM Product p
                LEFT JOIN Author a ON p.authorId = a.id
                WHERE p.name LIKE @keyword OR a.name LIKE @keyword
            `);
            
        console.log(`✅ Đã tìm thấy: ${result.recordset.length} kết quả từ Database.`); 
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Lỗi SQL khi tìm kiếm:", err);
        res.status(500).send("Lỗi máy chủ khi tìm kiếm");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🌐 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`===========================================\n`);
});