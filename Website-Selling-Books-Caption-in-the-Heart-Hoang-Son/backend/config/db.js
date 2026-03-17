const sql = require('mssql');
require('dotenv').config();
const config = {
    server: 'localhost', // Hoặc 'localhost\\SQLEXPRESS' nếu bạn cài bản Express
    user: 'sa',          // Tên tài khoản (Thường là sa)
    password: '1', // Mật khẩu lúc bạn cài đặt SQL Server
    database: 'web_ban_truyen',   // Tên database phải khớp 100%
    options: {
        encrypt: false, // Dành cho Windows
        trustServerCertificate: true // Rất quan trọng để tránh lỗi chứng chỉ
    },
    port: 1433 // Cổng mặc định của SQL Server
};

// Cấu hình kết nối tới Microsoft SQL Server
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // Tắt mã hóa nếu bạn chạy ở máy tính cá nhân (localhost)
        trustServerCertificate: true // Bỏ qua kiểm tra chứng chỉ cho môi trường local
    }
};

// Hàm thực hiện kết nối
const connectDB = async () => {
    try {
        await sql.connect(dbConfig);
        console.log("✅ Đã kết nối thành công tới Microsoft SQL Server!");
    } catch (err) {
        console.error("❌ Lỗi kết nối CSDL:", err.message);
    }
};

// Gọi hàm kết nối
connectDB();

// Xuất thư viện sql ra để các file khác có thể dùng để viết câu lệnh Query
module.exports = sql;