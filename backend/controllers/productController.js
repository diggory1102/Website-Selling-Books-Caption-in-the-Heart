// Lấy truyện bán chạy nhất cho Carousel
const getBestSellers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 10 p.id, p.name, p.price, p.discount, p.sold, p.imageUrl, a.name as authorName 
            FROM Product p
            LEFT JOIN Author a ON p.authorId = a.id
            ORDER BY p.sold DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải truyện", error });
    }
};

// Tìm kiếm truyện tranh
const searchProducts = async (req, res) => {
    const keyword = req.query.q;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('keyword', sql.NVarChar, `%${keyword}%`)
            .query(`
                SELECT p.id, p.name as productName, p.price, p.imageUrl, a.name as authorName 
                FROM Product p
                LEFT JOIN Author a ON p.authorId = a.id
                WHERE p.name LIKE @keyword OR a.name LIKE @keyword
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tìm kiếm", error });
    }
};