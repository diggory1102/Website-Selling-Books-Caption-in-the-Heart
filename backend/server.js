const express = require('express');
const cors = require('cors');
require('dotenv').config();

// IMPORT CÁC BẢNG (MODELS) TỪ FILE database.js
const { Category, Product } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// ROUTE FAKE DỮ LIỆU (Chạy 1 lần trên web)
// ==========================================
app.get('/api/setup', async (req, res) => {
    try {
        await Category.deleteMany({}); 
        await Product.deleteMany({});

        const catManga = await Category.create({ name: 'Manga' });
        const catHanhDong = await Category.create({ name: 'Hành Động' });
        const catTrinhTham = await Category.create({ name: 'Trinh Thám' });

        await Product.create([
            { name: 'One Piece - Tập 101', authorName: 'Eiichiro Oda', price: 30000, sold: 5000, imageUrl: 'images/one-piece.png', categoryId: catManga._id },
            { name: 'Thám Tử Lừng Danh Conan', authorName: 'Gosho Aoyama', price: 25000, discount: '-10%', sold: 3200, imageUrl: 'images/conan.png', categoryId: catTrinhTham._id },
            { name: 'Doraemon - Truyện Ngắn', authorName: 'Fujiko F. Fujio', price: 20000, sold: 4800, imageUrl: 'images/doraemon.png', categoryId: catManga._id },
            { name: 'Naruto - Tập Cuối', authorName: 'Masashi Kishimoto', price: 22000, discount: '-5%', sold: 2100, imageUrl: 'images/naruto.png', categoryId: catHanhDong._id },
            { name: 'Thanh Gươm Diệt Quỷ', authorName: 'Koyoharu Gotouge', price: 25000, discount: '-15%', sold: 1800, imageUrl: 'images/diet-quy.png', categoryId: catHanhDong._id },
            { name: 'Chú Thuật Hồi Chiến', authorName: 'Gege Akutami', price: 35000, sold: 1500, imageUrl: 'images/chuthuathoichien.png', categoryId: catHanhDong._id }
        ]);
        res.send("<h1>✅ Đã tạo dữ liệu MongoDB thành công! Hãy quay lại trang chủ web ấn F5.</h1>");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// ==========================================
// CÁC ROUTE API CHÍNH DÀNH CHO TRANG WEB
// ==========================================
app.get('/', (req, res) => res.send("🚀 Backend API đang chạy tốt!"));

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
});

app.get('/api/products/best-sellers', async (req, res) => {
    try {
        const products = await Product.find().sort({ sold: -1 }).limit(8); 
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; 
        if (!keyword) return res.json([]); 

        const products = await Product.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } }, 
                { authorName: { $regex: keyword, $options: 'i' } }
            ]
        }).limit(5);

        const formattedProducts = products.map(p => ({
            id: p.id,
            productName: p.name,
            price: p.price,
            imageUrl: p.imageUrl,
            authorName: p.authorName
        }));

        res.json(formattedProducts);
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🌐 Server API đang lắng nghe tại cổng: ${PORT}`);
    console.log(`===========================================\n`);
});