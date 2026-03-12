// Lấy toàn bộ danh mục cho menu có thanh cuộn
const getCategories = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Truy vấn bảng Category (số ít)
        const result = await pool.request().query("SELECT id, name FROM Category ORDER BY id ASC");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải danh mục", error });
    }
};