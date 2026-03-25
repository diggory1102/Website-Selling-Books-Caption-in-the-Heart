const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs'); 
const { User } = require('./database'); // Đảm bảo đã import User từ database.js
const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
require('dotenv').config();

// IMPORT CÁC BẢNG (MODELS) TỪ FILE database.js
const { Category, Product, Subscriber, Bill, Payment, Delivery, Promotion } = require('./database');

// IMPORT ROUTES
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Session (bắt buộc để dùng Passport)
app.use(session({ secret: 'caption-in-the-heart-secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Hỗ trợ Passport đóng gói và giải nén dữ liệu User
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));



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
            { name: 'Chú Thuật Hồi Chiến', authorName: 'Gege Akutami', price: 35000, sold: 1500, imageUrl: 'images/chuthuathoichien.png', categoryId: catHanhDong._id },
            { name: 'Chú Thuật Hồi Chiến-2', authorName: 'Gege Akutami', price: 35000, sold: 1500, imageUrl: 'images/chuthuathoichien.png', categoryId: catHanhDong._id },
            { name: 'Chú Thuật Hồi Chiến-3', authorName: 'Gege Akutami', price: 35000, sold: 1500, imageUrl: 'images/chuthuathoichien.png', categoryId: catHanhDong._id },
            { name: 'Chú Thuật Hồi Chiến-4', authorName: 'Gege Akutami', price: 35000, sold: 1500, imageUrl: 'images/chuthuathoichien.png', categoryId: catHanhDong._id },
            { name: 'Chú Thuật Hồi Chiến-5', authorName: 'Gege Akutami', price: 35000, sold: 1500, imageUrl: 'images/chuthuathoichien.png', categoryId: catHanhDong._id },
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

// SỬ DỤNG ROUTES ĐÃ ĐƯỢC TÁCH
app.use('/api', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

// ==========================================
// CẤU HÌNH ĐĂNG NHẬP GOOGLE
// ==========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Sẽ lấy từ Google Cloud Console
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Sẽ lấy từ Google Cloud Console
    callbackURL: "http://127.0.0.1:5000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
      try {
          // Lấy email và tên từ Google
          const email = profile.emails[0].value;
          const fullName = profile.displayName;
          
          // Kiểm tra xem user có trong DB chưa
          let user = await User.findOne({ email: email });
          
          if (!user) {
              // Nếu chưa có, tự động tạo tài khoản mới
              const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
              const autoUserName = email.split('@')[0] + Math.floor(Math.random() * 1000); // Tạo userName ngẫu nhiên từ email
              
              user = await User.create({
                  fullName: fullName,
                  email: email,
                  userName: autoUserName,
                  password: randomPassword
              });
          }
          return done(null, user);
      } catch (err) {
          return done(err, null);
      }
  }
));

// ==========================================
// CẤU HÌNH ĐĂNG NHẬP FACEBOOK (Tương tự Google)
// ==========================================
passport.use(new FacebookStrategy({
    clientID: 'ĐIỀN_FACEBOOK_APP_ID_CỦA_BẠN_VÀO_ĐÂY', // Sẽ lấy từ Meta for Developers
    clientSecret: 'ĐIỀN_FACEBOOK_APP_SECRET_CỦA_BẠN_VÀO_ĐÂY',
    callbackURL: "http://127.0.0.1:5000/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
  },
  async (accessToken, refreshToken, profile, done) => {
      try {
          const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
          const fullName = profile.displayName;
          
          let user = await User.findOne({ email: email });
          if (!user) {
              const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
              const autoUserName = 'fb_' + profile.id; 
              user = await User.create({ fullName, email, userName: autoUserName, password: randomPassword });
          }
          return done(null, user);
      } catch (err) { return done(err, null); }
  }
));

// ==========================================
// API 1: LẤY DANH SÁCH YÊU THÍCH CỦA USER
// ==========================================
app.get('/api/wishlist/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
        
        // Mongoose tự động chuyển mảng ObjectId thành mảng String khi gửi về Client
        res.json(user.wishlist || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API 2: BẤM TIM (THÊM / XÓA) - Xử lý chuẩn ObjectId
// ==========================================
app.post('/api/wishlist/toggle', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

        // VÌ LÀ OBJECT_ID nên ta phải dùng .toString() để so sánh với ID gửi lên
        const index = user.wishlist.findIndex(id => id.toString() === productId.toString());
        
        if (index > -1) {
            // Nếu TÌM THẤY -> Xóa khỏi mảng
            user.wishlist.splice(index, 1);
        } else {
            // Nếu KHÔNG THẤY -> Thêm vào mảng (Mongoose tự động ép chuỗi thành ObjectId)
            user.wishlist.push(productId);
        }

        await user.save();
        res.json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Lấy CHI TIẾT các sản phẩm (Dành riêng cho trang wishlist.html)
app.get('/api/wishlist/details/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('wishlist');
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

        // Trả về mảng chứa FULL thông tin sản phẩm (đã được populate)
        res.json(user.wishlist || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// API: ĐĂNG KÝ NHẬN TIN (NEWSLETTER)
// ==========================================
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Vui lòng nhập email!" });

        const existing = await Subscriber.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: "Email này đã đăng ký nhận tin rồi!" });

        await Subscriber.create({ email });
        res.json({ success: true, message: "Đăng ký nhận tin thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// ==========================================
// API: LẤY DANH SÁCH MÃ GIẢM GIÁ KHẢ DỤNG
// ==========================================
app.get('/api/promotions/available', async (req, res) => {
    try {
        const now = new Date();
        // Tìm các mã còn hạn và chưa hết lượt dùng
        const promotions = await Promotion.find({
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        });
        
        res.json({ success: true, promotions });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// ==========================================
// API: KIỂM TRA MÃ GIẢM GIÁ (VOUCHER)
// ==========================================
app.post('/api/promotions/apply', async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        const promotion = await Promotion.findOne({ code: code });
        
        if (!promotion) return res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại!" });
        
        const now = new Date();
        if (now < promotion.startDate || now > promotion.endDate) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã hết hạn hoặc chưa bắt đầu!" });
        }
        
        if (promotion.usedCount >= promotion.usageLimit) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng!" });
        }
        
        if (orderValue < promotion.minOrderValue) {
            return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${Number(promotion.minOrderValue).toLocaleString()}đ để áp dụng!` });
        }
        
        res.json({ success: true, promotion });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
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