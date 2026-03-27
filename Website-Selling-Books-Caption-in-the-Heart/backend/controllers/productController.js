const { Product, Category } = require('../database');

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
};

const getBestSellers = async (req, res) => {
    try {
        const products = await Product.find().sort({ sold: -1 }).limit(8); 
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server" });
    }
};

const getNewestProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;

        const productsFromDB = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedProducts = productsFromDB.map(p => ({
            id: p._id, name: p.name, price: p.price,
            imageUrl: p.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
            discount: p.discount || null, sold: p.sold || 0,
            rating: p.averageRating || 0, authorName: p.authorName, isNew: true,
            totalReviews: p.totalReviews || 0
        }));
        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId').populate('authorId').populate('publisherId');
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json(product);
    } catch (err) { res.status(500).json({ error: "Lỗi Server" }); }
};

const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        const sameAuthor = await Product.find({ authorName: product.authorName, _id: { $ne: product._id } }).limit(4); 
        const sameCategory = await Product.find({ categoryId: product.categoryId, _id: { $ne: product._id } }).limit(4);

        res.json({ sameAuthor, sameCategory });
    } catch (err) { res.status(500).json({ error: "Lỗi Server" }); }
};

const searchProducts = async (req, res) => {
    try {
        const keyword = req.query.q; 
        const categoryId = req.query.category;
        const sortParam = req.query.sort;
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        let queryObj = {};

        if (keyword) queryObj.$or = [{ name: { $regex: keyword, $options: 'i' } }, { authorName: { $regex: keyword, $options: 'i' } }];
        if (categoryId) queryObj.categoryId = categoryId;
        if (minPrice || maxPrice) {
            queryObj.price = {};
            if (minPrice) queryObj.price.$gte = Number(minPrice);
            if (maxPrice) queryObj.price.$lte = Number(maxPrice);
        }

        let sortObj = {};
        if (sortParam === 'price_asc') sortObj.price = 1;
        else if (sortParam === 'price_desc') sortObj.price = -1;
        else if (sortParam === 'newest') sortObj.createdAt = -1; 

        const totalProducts = await Product.countDocuments(queryObj);
        const totalPages = Math.ceil(totalProducts / limit);
        const skip = (page - 1) * limit;

        const products = await Product.find(queryObj).sort(sortObj).skip(skip).limit(limit);

        const formattedProducts = products.map(p => ({
            id: p.id, productName: p.name, price: p.price, discount: p.discount,
            imageUrl: p.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
            authorName: p.authorName, averageRating: p.averageRating, sold: p.sold,
            totalReviews: p.totalReviews || 0
        }));

        res.json({ products: formattedProducts, totalPages: totalPages, currentPage: page });
    } catch (err) { res.status(500).json({ error: "Lỗi Server" }); }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (err) { res.status(500).json({ error: "Lỗi Server" }); }
};

module.exports = {
    getCategories,
    getBestSellers,
    getNewestProducts,
    getProductById,
    getRelatedProducts,
    searchProducts,
    getAllProducts
};