const mongoose = require('mongoose');

// ==========================================
// 1. KẾT NỐI MONGODB
// ==========================================
mongoose.connect('mongodb://127.0.0.1:27017/web_ban_truyen')
    .then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
    .catch(err => console.log('❌ Lỗi kết nối MongoDB:', err));

// ==========================================
// 2. KHỞI TẠO CÁC SCHEMA (BẢNG)
// ==========================================
const schemaOptions = { 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true },
    timestamps: true 
};

// --- BẢNG PHÂN QUYỀN (CHUẨN BỊ CHO C++) ---
const RoleSchema = new mongoose.Schema({ 
    name: { type: String, required: true }, // 'Admin', 'Staff', 'Customer'
    authority: String 
}, schemaOptions);
const Role = mongoose.model('Role', RoleSchema);

// --- BẢNG NGƯỜI DÙNG (CHUNG CHO CẢ KHÁCH VÀ NHÂN VIÊN) ---
const UserSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: String,
    email: { type: String, required: true, unique: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Khóa ngoại liên kết phân quyền
    address: String,
    numberPhone: String,
    isOnline: { type: Boolean, default: false },
    
    // DANH SÁCH YÊU THÍCH ĐƯỢC GỘP VÀO ĐÂY (Chuẩn 100%)
    wishlist: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }]
}, schemaOptions); 
const User = mongoose.model('User', UserSchema);

// --- CÁC BẢNG DANH MỤC SẢN PHẨM ---
const CategorySchema = new mongoose.Schema({ name: { type: String, required: true }, description: String, imageUrl: String }, schemaOptions);
const Category = mongoose.model('Category', CategorySchema);

const AuthorSchema = new mongoose.Schema({ name: { type: String, required: true }, shortDesc: String, description: String }, schemaOptions);
const Author = mongoose.model('Author', AuthorSchema);

const PublisherSchema = new mongoose.Schema({ name: { type: String, required: true }, shortDesc: String, description: String }, schemaOptions);
const Publisher = mongoose.model('Publisher', PublisherSchema);

// --- BẢNG SẢN PHẨM (TRUYỆN TRANH) ---
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
    authorName: String, 
    publisherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publisher' },
    publisherName: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categoryName: String,
    
    price: { type: Number, required: true },
    discount: { type: String }, 
    sold: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    description: String,
    imageUrl: String,
    
    // Cho phép đánh giá sản phẩm (Lưu trung bình sao để load nhanh)
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, schemaOptions);
const Product = mongoose.model('Product', ProductSchema);

// --- BẢNG ĐÁNH GIÁ (UC Quản lý đánh giá) ---
const RateSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: String,
    status: { type: String, default: 'Đã duyệt' } // Để admin kiểm duyệt
}, schemaOptions);
const Rate = mongoose.model('Rate', RateSchema);

// --- BẢNG KHUYẾN MÃI (BỔ SUNG THEO ĐẶC TẢ WORD) ---
const PromotionSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // Mã giảm giá (VD: TET2024)
    discountAmount: { type: Number, default: 0 },         // Giảm theo số tiền (VD: 20000)
    discountPercent: { type: Number, default: 0 },        // Giảm theo % (VD: 15)
    minOrderValue: { type: Number, default: 0 },          // Đơn tối thiểu để áp dụng
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },           // Giới hạn số lượt dùng
    usedCount: { type: Number, default: 0 }               // Số lượt đã dùng
}, schemaOptions);
const Promotion = mongoose.model('Promotion', PromotionSchema);

// --- CÁC BẢNG THANH TOÁN & GIAO HÀNG ---
const PaymentSchema = new mongoose.Schema({ method: String, status: String }, schemaOptions);
const Payment = mongoose.model('Payment', PaymentSchema);

const DeliverySchema = new mongoose.Schema({ unitName: String, trackingCode: String, status: String }, schemaOptions);
const Delivery = mongoose.model('Delivery', DeliverySchema);

// --- BẢNG ĐƠN HÀNG (ĐÃ BỔ SUNG KHUYẾN MÃI) ---
const LineItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true } 
}, { _id: false }); 

const BillSchema = new mongoose.Schema({
    billCode: { type: String, unique: true }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },      
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    
    // Bổ sung thông tin tính tiền và khuyến mãi
    subTotal: { type: Number, required: true }, // Tổng tiền hàng chưa giảm
    promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' }, // Mã đã xài
    discountValue: { type: Number, default: 0 }, // Số tiền được giảm
    totalPrice: { type: Number, required: true }, // Khách phải trả cuối cùng
    
    status: { type: String, default: 'Chờ xử lý' },
    items: [LineItemSchema] 
}, schemaOptions);

BillSchema.pre('save', function(next) {
    if (!this.billCode) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        this.billCode = 'HD-' + randomNum;
    }
    next();
});
const Bill = mongoose.model('Bill', BillSchema);


// ==========================================
// 3. XUẤT CÁC MODEL ĐỂ FILE KHÁC CÓ THỂ GỌI
// ==========================================
module.exports = {
    Role, User, Category, Author, Publisher, Product, Rate, Promotion, Payment, Delivery, Bill
};