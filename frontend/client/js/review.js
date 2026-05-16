document.addEventListener('DOMContentLoaded', async () => {
    const userId = getCurrentUserId();
    if (!userId) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const reviewList = document.getElementById('reviewList');
    
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/reviews/reviewable/${userId}`);
        const data = await res.json();
        
        if (data.success) {
            if (data.items.length === 0) {
                reviewList.innerHTML = `<div class="empty-review"><i class="fa-solid fa-clipboard-check"></i><p>Bạn không có sản phẩm nào cần đánh giá.</p></div>`;
                return;
            }

            reviewList.innerHTML = data.items.map(item => `
                <div class="review-item">
                    <div class="review-info">
                        <a href="product-detail.html?id=${item.productId}"><img src="${item.imageUrl}" onerror="this.src='https://placehold.jp/100x140.png'"></a>
                        <div>
                            <div class="review-name">${item.productName}</div>
                            <div class="review-date">Mua ngày: ${new Date(item.orderDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                    </div>
                    <button class="btn-do-review" onclick="openReviewModal('${item.productId}', '${item.productName}')">Đánh giá ngay</button>
                </div>
            `).join('');
        }
    } catch (err) {
        reviewList.innerHTML = `<p style="text-align:center; color:red;">Lỗi tải dữ liệu!</p>`;
    }
});

// Lô-gic xử lý Modal Popup Đánh giá
let currentReviewProductId = null;
let currentRating = 5;

window.openReviewModal = function(productId, productName) {
    currentReviewProductId = productId;
    document.getElementById('rvProductName').textContent = productName;
    document.getElementById('reviewContent').value = '';
    setRating(5); // Mặc định 5 sao
    document.getElementById('reviewModal').classList.add('show');
}

window.closeReviewModal = function() {
    document.getElementById('reviewModal').classList.remove('show');
}

window.setRating = function(stars) {
    currentRating = stars;
    const container = document.getElementById('starContainer');
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<i class="${i <= stars ? 'fa-solid active' : 'fa-regular'} fa-star" onclick="setRating(${i})"></i>`;
    }
    container.innerHTML = html;
}

window.submitReview = async function() {
    const content = document.getElementById('reviewContent').value.trim();
    const userId = getCurrentUserId();

    const btnSubmit = document.getElementById('btnSubmitReview');
    btnSubmit.disabled = true;
    btnSubmit.textContent = "ĐANG GỬI...";

    try {
        const res = await fetch('http://127.0.0.1:5000/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId: currentReviewProductId, rating: currentRating, content })
        });
        const data = await res.json();

        if (data.success) {
            if (typeof showToast === 'function') showToast("🎉 " + data.message, "success");
            closeReviewModal();
            setTimeout(() => window.location.reload(), 1500); // Reset danh sách
        } else {
            if (typeof showToast === 'function') showToast(data.message, "error");
        }
    } catch (err) {
        if (typeof showToast === 'function') showToast("Lỗi kết nối máy chủ!", "error");
    }
}