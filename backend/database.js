const mongoose = require('mongoose');

// ==========================================
// 1. KẾT NỐI MONGODB
// ==========================================
// Nhớ đổi tên 'web_ban_truyen' thành 'Captionintheheart' nếu db của bạn tên là vậy nhé
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

const RoleSchema = new mongoose.Schema({ name: { type: String, required: true }, authority: String }, schemaOptions);
const Role = mongoose.model('Role', RoleSchema);

const UserSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: String,
    email: { type: String, required: true, unique: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    address: String,
    numberPhone: String,
    isOnline: { type: Boolean, default: false }
}, schemaOptions); 
const User = mongoose.model('User', UserSchema);

const CategorySchema = new mongoose.Schema({ name: { type: String, required: true }, description: String, imageUrl: String }, schemaOptions);
const Category = mongoose.model('Category', CategorySchema);

const AuthorSchema = new mongoose.Schema({ name: { type: String, required: true }, shortDesc: String, description: String }, schemaOptions);
const Author = mongoose.model('Author', AuthorSchema);

const PublisherSchema = new mongoose.Schema({ name: { type: String, required: true }, shortDesc: String, description: String }, schemaOptions);
const Publisher = mongoose.model('Publisher', PublisherSchema);

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
    authorName: String, // Cột này tiện cho việc Search
    publisherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publisher' }, 
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },   
    price: { type: Number, required: true, default: 0 },
    discount: String,
    sold: { type: Number, default: 0 },
    imageUrl: String
}, schemaOptions); 
const Product = mongoose.model('Product', ProductSchema);

const RateSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 0, max: 5 },
}, schemaOptions);
const Rate = mongoose.model('Rate', RateSchema);

const PaymentSchema = new mongoose.Schema({ name: String, content: String }, schemaOptions);
const Payment = mongoose.model('Payment', PaymentSchema);

const DeliverySchema = new mongoose.Schema({ deliveryKey: String }, schemaOptions);
const Delivery = mongoose.model('Delivery', DeliverySchema);

const LineItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true } 
}, { _id: false }); 

const BillSchema = new mongoose.Schema({
    billCode: { type: String, unique: true }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },      
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    totalPrice: { type: Number, required: true },
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
    Role, User, Category, Author, Publisher, Product, Rate, Payment, Delivery, Bill
};