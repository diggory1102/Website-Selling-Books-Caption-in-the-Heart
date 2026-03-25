document.addEventListener('DOMContentLoaded', async () => {
    const userId = getCurrentUserId(); // Hàm lấy từ main.js
    if (!userId) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập để xem danh sách yêu thích!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const container = document.getElementById('wishlistContainer');
    const countText = document.getElementById('wishlistCountText');

    container.innerHTML = `<div style="text-align:center; padding: 50px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: #ccc;"></i><p style="margin-top:10px; color: #666;">Đang tải dữ liệu...</p></div>`;

    try {
        // Gọi API lấy ĐẦY ĐỦ thông tin của các sản phẩm được lưu ID trong DB
        const response = await fetch(`http://127.0.0.1:5000/api/wishlist/details/${userId}`);
        const products = await response.json();

        if (products.length === 0) {
            container.innerHTML = `
                <div class="wishlist-empty">
                    <i class="fa-solid fa-heart-crack"></i>
                    <p>Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.</p>
                    <a href="index.html" class="btn-shopping">Khám phá ngay</a>
                </div>
            `;
            countText.textContent = 0;
            return;
        }

        countText.textContent = products.length;
        
        // Tận dụng hoàn toàn class lưới (.product-grid) và khung thẻ (.product-card) của global.css
        let html = '<div class="product-grid">';
        html += products.map(item => {
            const productId = String(item._id || item.id);
            
            // Vẽ sao từ DB
            const rating = item.averageRating || 0;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                else starsHtml += '<i class="fa-regular fa-star"></i>';
            }

            // Tính toán giá nếu có chiết khấu
            let origPrice = item.price;
            let fnPrice = origPrice;
            if (item.discount && item.discount.includes('%')) {
                let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
            }
            const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
            const oldPriceHtml = fnPrice < origPrice ? `<span class="old">${Number(origPrice).toLocaleString()}đ</span>` : '';

            // Render Card (Giống hệt trang chủ, nhưng nút trái tim sẽ thành hàm Xóa)
            return `
            <div class="product-card" id="card-${productId}">
                <div class="wishlist-btn" onclick="removeWishlistItem(event, '${productId}')" style="position: absolute; top: 10px; right: 10px; z-index: 999; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;">
                    <i class="fa-solid fa-heart" style="color: #e74c3c; transition: 0.2s;"></i>
                </div>

                ${item.isNew ? `<span class="new-badge">Mới</span>` : ''}

                <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit; display: block; height: 100%;">
                    <div class="img-box">
                        ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                        <img src="${item.imageUrl || 'https://placehold.co/200x250?text=No+Image'}" alt="${item.name}">
                    </div>
                    <div class="info-box">
                        <h3 class="name">${item.name}</h3>
                        <div class="stars">
                            ${starsHtml}
                            <span style="color: #888; font-size: 11px; margin-left: 5px;">(${item.totalReviews || 0})</span>
                            <span class="sold-count">| Đã bán ${item.sold || 0}</span>
                        </div>
                        <div class="price-group">
                            <span class="now">${priceFormatted}</span>
                            ${oldPriceHtml}
                        </div>
                    </div>
                </a>
            </div>
            `;
        }).join('');
        html += '</div>';

        container.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="text-align:center; padding: 50px; background:#fff; border-radius:12px;"><p>Lỗi kết nối máy chủ!</p></div>`;
    }
});

// Hàm xóa tim chuyên biệt cho trang Wishlist (Thêm hiệu ứng trượt mượt mà)
window.removeWishlistItem = async function(event, productId) {
    event.preventDefault(); 
    event.stopPropagation();

    // Gọi lại API Toggle ở main.js nhưng truyền bằng tay để bắt sự kiện
    try {
        const userId = getCurrentUserId();
        const res = await fetch('http://127.0.0.1:5000/api/wishlist/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, productId }) });
        const data = await res.json();
        
        if (data.success) {
            if (typeof showToast === 'function') showToast("Đã bỏ yêu thích truyện này", "success");
            // Tải lại mảng toàn cục trong Header và tải lại trang tự động sau 0.5s để cập nhật lưới
            setTimeout(() => window.location.reload(), 500); 
        }
    } catch (err) { console.error(err); }
}