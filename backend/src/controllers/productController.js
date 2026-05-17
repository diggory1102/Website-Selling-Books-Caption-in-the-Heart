const { Product, Category, Author, Publisher, Promotion } = require('../models/database');

// Helper to compute and apply direct discounts to products
const applyDirectPromotionsToProducts = async (products) => {
    try {
        const now = new Date();
        const activePromos = await Promotion.find({
            type: 'DIRECT',
            status: 'ACTIVE',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (!activePromos || activePromos.length === 0) return products;

        return products.map(p => {
            const productObj = p.toObject ? p.toObject() : p;
            const productIdStr = productObj._id ? productObj._id.toString() : (productObj.id ? productObj.id.toString() : '');

            let bestDiscountAmount = 0;
            let bestDiscountString = productObj.discount || null;

            for (const promo of activePromos) {
                let isApplicable = false;
                if (promo.applyTo === 'ALL') {
                    isApplicable = true;
                } else if (promo.applyTo === 'PRODUCT' && promo.targetValues.includes(productIdStr)) {
                    isApplicable = true;
                } else if (promo.applyTo === 'CATEGORY' && promo.targetValues.includes(productObj.categoryName)) {
                    isApplicable = true;
                } else if (promo.applyTo === 'AUTHOR' && promo.targetValues.includes(productObj.authorName)) {
                    isApplicable = true;
                } else if (promo.applyTo === 'PUBLISHER' && promo.targetValues.includes(productObj.publisherName)) {
                    isApplicable = true;
                }

                if (isApplicable) {
                    let discountAmount = 0;
                    if (promo.discountType === 'PERCENT') {
                        discountAmount = (productObj.price * promo.discountValue) / 100;
                        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
                            discountAmount = promo.maxDiscount;
                        }
                    } else if (promo.discountType === 'AMOUNT') {
                        discountAmount = promo.discountValue;
                    }

                    if (discountAmount > bestDiscountAmount) {
                        bestDiscountAmount = discountAmount;
                        if (promo.discountType === 'PERCENT') {
                            bestDiscountString = `-${promo.discountValue}%`;
                        } else {
                            bestDiscountString = `-${Math.round((discountAmount / productObj.price) * 100)}%`;
                        }
                    }
                }
            }

            if (bestDiscountAmount > 0) {
                return {
                    ...productObj,
                    discount: bestDiscountString,
                    discountedPrice: productObj.price - bestDiscountAmount
                };
            }

            return productObj;
        });
    } catch (err) {
        console.error("Lỗi applyDirectPromotionsToProducts:", err);
        return products;
    }
};

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
        const promoProducts = await applyDirectPromotionsToProducts(products);
        const formatted = promoProducts.map(p => ({
            id: p._id,
            _id: p._id,
            name: p.name,
            price: p.price,
            discount: p.discount,
            sold: p.sold,
            imageUrl: p.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
            averageRating: p.averageRating || 0,
            totalReviews: p.totalReviews || 0,
            authorName: p.authorName
        }));
        res.json(formatted);
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

        const promoProducts = await applyDirectPromotionsToProducts(productsFromDB);

        const formattedProducts = promoProducts.map(p => ({
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
        const promoProducts = await applyDirectPromotionsToProducts([product]);
        res.json(promoProducts[0]);
    } catch (err) { res.status(500).json({ error: "Lỗi Server" }); }
};

const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        const sameAuthor = await Product.find({ authorName: product.authorName, _id: { $ne: product._id } }).limit(4); 
        const sameCategory = await Product.find({ categoryId: product.categoryId, _id: { $ne: product._id } }).limit(4);

        const promoSameAuthor = await applyDirectPromotionsToProducts(sameAuthor);
        const promoSameCategory = await applyDirectPromotionsToProducts(sameCategory);

        res.json({ sameAuthor: promoSameAuthor, sameCategory: promoSameCategory });
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

        const promoProducts = await applyDirectPromotionsToProducts(products);

        const formattedProducts = promoProducts.map(p => ({
            id: p._id || p.id, productName: p.name, price: p.price, discount: p.discount,
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

const addProduct = async (req, res) => {
    try {
        const { name, nxb, author, category, publishDate, price, stock, isbn, imageUrl } = req.body;
        const cat = await Category.findOne({ name: category });
        
        await Product.create({
            name, authorName: author, publisherName: nxb, price, stock, isbn, imageUrl,
            categoryName: category, categoryId: cat ? cat._id : null, publishDate
        });
        res.json({ success: true, message: "Đã thêm sản phẩm!" });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateProduct = async (req, res) => {
    try {
        const { name, nxb, author, category, publishDate, price, stock, isbn, imageUrl } = req.body;
        const cat = await Category.findOne({ name: category });
        const updated = await Product.findByIdAndUpdate(req.params.id, {
            name, authorName: author, publisherName: nxb, price, stock, isbn, imageUrl,
            categoryName: category, categoryId: cat ? cat._id : null, publishDate
        }, { new: true });
        res.json({ success: true, product: updated });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Đã xóa sản phẩm!" });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getProductMetadata = async (req, res) => {
    try {
        const categories = await Category.find({}, 'name');
        const authors = await Author.find({}, 'name');
        const publishers = await Publisher.find({}, 'name');
        const products = await Product.find({}, 'name');

        res.json({
            success: true,
            categories: categories.map(c => c.name),
            authors: authors.map(a => a.name),
            publishers: publishers.map(p => p.name),
            products: products.map(p => ({ id: p._id, name: p.name }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getCategories, getBestSellers, getNewestProducts, getProductById, getRelatedProducts,
    searchProducts, getAllProducts, addProduct, updateProduct, deleteProduct, getProductMetadata,
    applyDirectPromotionsToProducts
};
