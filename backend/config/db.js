const sql = require('mssql');
require('dotenv').config();

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