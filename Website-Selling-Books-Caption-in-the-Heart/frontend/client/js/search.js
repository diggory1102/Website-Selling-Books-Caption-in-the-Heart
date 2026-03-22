document.addEventListener('DOMContentLoaded', async () => {
    const searchGrid = document.getElementById('searchGrid');
    const searchTitle = document.getElementById('searchTitle');
    
    // 1. Lấy từ khóa "q" từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query) {
        searchTitle.textContent = "Bạn chưa nhập từ khóa tìm kiếm.";
        return;
    }

    searchTitle.innerHTML = `Kết quả tìm kiếm cho: <span>"${query}"</span>`;

    try {
        // 2. Gọi API tìm kiếm (Sử dụng cổng 5000)
        const response = await fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(query)}`);
        const products = await response.json();

        if (products.length === 0) {
            searchGrid.innerHTML = `<div class="no-results">Rất tiếc, không tìm thấy truyện nào khớp với từ khóa của bạn.</div>`;
            return;
        }

        // 3. Vẽ kết quả (Dùng chung Class product-card để ăn CSS cũ)
        searchGrid.innerHTML = products.map(item => {
            const productId = item.id;
            const priceFormatted = Number(item.price).toLocaleString() + 'đ';
            
            return `
                <div class="product-card">
                    <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit;">
                        <div class="img-box">
                            <img src="${item.imageUrl}" onerror="this.src='https://placehold.jp/200x250.png?text=No+Image'">
                        </div>
                        <div class="info-box">
                            <h3 class="name">${item.productName || item.name}</h3>
                            <div class="stars">
                                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                            </div>
                            <div class="price-group">
                                <span class="now">${priceFormatted}</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Lỗi trang search:", error);
        searchGrid.innerHTML = `<p>Có lỗi xảy ra khi tải dữ liệu.</p>`;
    }
});