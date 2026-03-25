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
// ==========================================
// API: Lấy truyện MỚI CẬP NHẬT 
// ==========================================
// ==========================================
// API TRUYỆN MỚI CẬP NHẬT (Đã sửa lỗi Đã bán)
// ==========================================
app.get('/api/products/newest', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;

        const productsFromDB = await Product.find().sort({ _id: -1 }).skip(skip).limit(limit);

        const formattedProducts = productsFromDB.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
            discount: p.discount || null,
            sold: p.sold || 0,           // Lấy đúng số lượng đã bán từ DB
            rating: p.averageRating , // Lấy đúng số sao từ DB
            authorName: p.authorName,
            isNew: true
        }));
        res.json(formattedProducts);
    } catch (error) { res.status(500).json({ success: false, message: "Lỗi Server" }); }
});

// ==========================================
// API: LẤY CHI TIẾT 1 SẢN PHẨM THEO ID
// ==========================================
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId')
            .populate('authorId')
            .populate('publisherId');
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// ==========================================
// API: LẤY TRUYỆN CÙNG TÁC GIẢ VÀ THỂ LOẠI
// ==========================================
app.get('/api/products/:id/related', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        const sameAuthor = await Product.find({ 
            authorName: product.authorName, 
            _id: { $ne: product._id } // Loại trừ truyện hiện tại
        }).limit(4); // Lấy tối đa 4 truyện cho đẹp layout

        const sameCategory = await Product.find({ 
            categoryId: product.categoryId, 
            _id: { $ne: product._id } 
        }).limit(4);

        res.json({ sameAuthor, sameCategory });
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; 
        const categoryId = req.query.category;
        const sortParam = req.query.sort;
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Hiển thị 12 truyện mỗi trang

        let queryObj = {};

        if (keyword) {
            queryObj.$or = [
                { name: { $regex: keyword, $options: 'i' } }, 
                { authorName: { $regex: keyword, $options: 'i' } }
            ];
        }
        
        if (categoryId) queryObj.categoryId = categoryId;

        if (minPrice || maxPrice) {
            queryObj.price = {};
            if (minPrice) queryObj.price.$gte = Number(minPrice);
            if (maxPrice) queryObj.price.$lte = Number(maxPrice);
        }

        let sortObj = {};
        if (sortParam === 'price_asc') {
            sortObj.price = 1;
        } else if (sortParam === 'price_desc') {
            sortObj.price = -1;
        } else if (sortParam === 'newest') {
            sortObj.createdAt = -1; // Sắp xếp giảm dần theo thời gian tạo (-1 là mới nhất)
        }

        // Đếm tổng số kết quả để tính ra số trang
        const totalProducts = await Product.countDocuments(queryObj);
        const totalPages = Math.ceil(totalProducts / limit);
        const skip = (page - 1) * limit;

        const products = await Product.find(queryObj).sort(sortObj).skip(skip).limit(limit);

        const formattedProducts = products.map(p => ({
            id: p.id,
            productName: p.name,
            price: p.price,
            discount: p.discount,
            imageUrl: p.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
            authorName: p.authorName,
            averageRating: p.averageRating,
            sold: p.sold
        }));

        res.json({
            products: formattedProducts,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// ==========================================
// API XÁC THỰC NGƯỜI DÙNG (AUTH)
// ==========================================

// 1. ĐĂNG KÝ (Register)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { userName, email, password, fullName } = req.body;
        
        // Kiểm tra xem User hoặc Email đã tồn tại chưa
        const userExists = await User.findOne({ $or: [{ userName }, { email }] });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc Email đã được sử dụng!" });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Lưu vào Database
        await User.create({
            userName, 
            email, 
            fullName, 
            password: hashedPassword // Lưu pass đã mã hóa
        });

        res.json({ success: true, message: "Đăng ký thành công! Hãy đăng nhập." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 2. ĐĂNG NHẬP (Login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { userName, password } = req.body;

        // Tìm User trong DB
        const user = await User.findOne({ userName });
        if (!user) {
            return res.status(400).json({ success: false, message: "Tài khoản không tồn tại!" });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Sai mật khẩu!" });
        }

        // Nếu đúng, trả về thông tin user (không trả về pass)
        res.json({ 
            success: true, 
            message: "Đăng nhập thành công!",
            user: { id: user._id, userName: user.userName, fullName: user.fullName, role: user.roleId }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 3. QUÊN MẬT KHẨU (Gửi email - Tạm thời mô phỏng)
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ success: false, message: "Email này chưa được đăng ký!" });
        }

        // Trong thực tế, bạn sẽ dùng thư viện Nodemailer để gửi link reset qua email.
        // Ở đây ta mô phỏng việc gửi thành công:
        res.json({ success: true, message: "Hướng dẫn lấy lại mật khẩu đã được gửi vào email của bạn!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

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

// API kích hoạt đăng nhập Google
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// API nhận kết quả từ Google trả về
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://127.0.0.1:5500/login.html' }),
  function(req, res) {
      // Đăng nhập thành công -> Gói thông tin user đẩy về giao diện (Frontend)
      const userInfo = {
          id: req.user._id,
          userName: req.user.userName,
          fullName: req.user.fullName,
          role: req.user.roleId
      };
      // Chuyển hướng về trang chủ kèm theo dữ liệu mã hóa trên thanh URL
      const userStr = encodeURIComponent(JSON.stringify(userInfo));
      res.redirect(`http://127.0.0.1:5500/Website-Selling-Books-Caption-in-the-Heart/frontend/client/index.html?socialUser=${userStr}`);
  }
);

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

app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/api/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: 'http://127.0.0.1:5500/login.html' }),
  function(req, res) {
      const userInfo = { id: req.user._id, userName: req.user.userName, fullName: req.user.fullName };
      const userStr = encodeURIComponent(JSON.stringify(userInfo));
      res.redirect(`http://127.0.0.1:5500/index.html?socialUser=${userStr}`);
  }
);


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
// API: ĐĂNG NHẬP CỔNG ADMIN/NHÂN VIÊN (Gọi C++)
// ==========================================
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. KIỂM TRA MONGODB
        // Lưu ý: Có .populate('roleId') để lấy tên Role (Admin, Staff, Customer)
        const user = await User.findOne({ email }).populate('roleId');
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Email không tồn tại!" });
        }

        // Kiểm tra Pass (Giả sử bạn dùng bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Sai mật khẩu!" });
        }

        // Lấy tên chức vụ từ DB (Ví dụ: 'admin', 'staff', hoặc 'customer')
        const roleName = user.roleId ? user.roleId.name.toLowerCase() : "customer";

        // 2. GỌI C++ ĐỂ XỬ LÝ PHÂN QUYỀN (OOP)
        // Đường dẫn trỏ tới file exe vừa compile ở bước 1
        const cppExePath = path.join(__dirname, '../cpp_auth_core/auth_system.exe'); 

        // Gọi C++ và truyền 2 tham số: Email và Tên chức vụ
        execFile(cppExePath, [email, roleName], (error, stdout, stderr) => {
            if (error) {
                console.error("Lỗi khi chạy C++:", error);
                return res.status(500).json({ success: false, message: "Lỗi hệ thống lõi C++" });
            }

            // stdout chính là kết quả C++ in ra (chuỗi JSON)
            try {
                const cppResult = JSON.parse(stdout.trim());
                
                // Nếu C++ cho phép (Admin hoặc Staff)
                if (cppResult.success) {
                    res.json({
                        success: true,
                        message: cppResult.message,
                        role: cppResult.role,
                        user: {
                            id: user._id,
                            fullName: user.fullName,
                            email: user.email
                        }
                    });
                } else {
                    // Nếu C++ chặn (Customer)
                    res.status(403).json({
                        success: false,
                        message: cppResult.message // C++ báo: "Chào khách hàng, bạn không có quyền..."
                    });
                }
            } catch (parseErr) {
                res.status(500).json({ success: false, message: "C++ trả về sai định dạng" });
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Lấy danh sách truyện mới cập nhật (Phân trang)
app.get('/api/products/newest', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;

        const productsFromDB = await Product.find()
            .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất
            .skip(skip)
            .limit(limit);

        const formattedProducts = productsFromDB.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
            discount: p.discount || null,
            sold: p.sold || 0,
            rating: p.averageRating || 5, // Lấy từ trường averageRating trong DB
            authorName: p.authorName,
            isNew: true // Vì đây là API truyện mới
        }));

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
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
// API: TẠO ĐƠN HÀNG MỚI (CHECKOUT)
// ==========================================
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, items, shippingInfo, paymentMethod, subTotal, shippingFee, totalPrice, promotionId, discountValue } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Giỏ hàng trống!" });
        }

        // Tạo thông tin Thanh toán và Giao hàng trước
        const payment = await Payment.create({ method: paymentMethod, status: 'Chưa thanh toán' });
        const delivery = await Delivery.create({ unitName: 'Giao hàng tiêu chuẩn', status: 'Chờ lấy hàng' });

        // Tạo mã hóa đơn ngẫu nhiên (VD: HD-123456)
        const randomBillCode = 'HD-' + Math.floor(100000 + Math.random() * 900000);

        // Khởi tạo dữ liệu đơn hàng (Không truyền null để tránh lỗi MongoDB CastError)
        const billData = {
            billCode: randomBillCode,
            paymentId: payment._id,
            deliveryId: delivery._id,
            subTotal: subTotal,
            shippingFee: shippingFee,
            discountValue: discountValue || 0,
            totalPrice: totalPrice,
            
            status: 'Chờ xử lý',
            // Tương thích với nhiều cách đặt tên cột trong DB của bạn
            customerName: shippingInfo.name, name: shippingInfo.name,
            customerPhone: shippingInfo.phone, phone: shippingInfo.phone,
            shippingAddress: shippingInfo.address, address: shippingInfo.address,
            note: shippingInfo.note,
            
            items: items.map(item => ({ 
                productId: item.productId, 
                productName: item.name, name: item.name,
                quantity: item.quantity, 
                priceAtPurchase: item.price, price: item.price 
            }))
        };

        if (userId) billData.userId = userId;
        if (promotionId) billData.promotionId = promotionId;

        const newBill = await Bill.create(billData);

        // Cập nhật số lượt đã dùng của Voucher
        if (promotionId) {
            await Promotion.findByIdAndUpdate(promotionId, { $inc: { usedCount: 1 } });
        }

        res.json({ success: true, message: "Đặt hàng thành công!", orderId: newBill._id });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi tạo đơn hàng: " + err.message });
    }
});

// ==========================================
// API: LẤY DANH SÁCH ĐƠN HÀNG CỦA USER
// ==========================================
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const bills = await Bill.find({ userId: req.params.userId })
            .populate('paymentId')
            .populate('deliveryId')
            .populate('items.productId', 'imageUrl') // Populate để lấy được ảnh truyện
            .sort({ createdAt: -1 }); // Sắp xếp hóa đơn mới nhất lên đầu
        res.json({ success: true, orders: bills });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" });
    }
});

// ==========================================
// API: LẤY CHI TIẾT 1 ĐƠN HÀNG
// ==========================================
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Bill.findById(req.params.id)
            .populate('paymentId')
            .populate('deliveryId')
            .populate('items.productId', 'imageUrl name');
            
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi lấy chi tiết đơn hàng" });
    }
});

// ==========================================
// API: HỦY ĐƠN HÀNG
// ==========================================
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const order = await Bill.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        
        if (order.status !== 'Chờ xử lý') {
            return res.status(400).json({ success: false, message: "Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý" });
        }

        order.status = 'Đã hủy';
        await order.save();
        
        res.json({ success: true, message: "Đã hủy đơn hàng thành công!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi khi hủy đơn hàng: " + err.message });
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