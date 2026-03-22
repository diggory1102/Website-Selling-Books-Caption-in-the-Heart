document.addEventListener('DOMContentLoaded', async () => {
    const catGrid = document.getElementById('catGrid');
    const catTitle = document.getElementById('catTitle');
    const bcCategoryName = document.getElementById('bcCategoryName');
    const sidebarCategoryList = document.getElementById('sidebarCategoryList');
    const catSort = document.getElementById('catSort');
    
    // Lấy các tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id'); // Dùng 'id' theo link trang chủ gửi qua
    const sortParam = urlParams.get('sort');
    const priceParam = urlParams.get('price');
    const pageParam = parseInt(urlParams.get('page')) || 1;

    // Hàm cập nhật URL khi người dùng thay đổi bộ lọc
    const applyFilters = () => {
        let newUrl = `category.html?`;
        if (categoryId) newUrl += `id=${categoryId}&`;
        
        const selectedSort = catSort.value;
        if (selectedSort) newUrl += `sort=${selectedSort}&`;

        const selectedPrice = document.querySelector('input[name="priceFilter"]:checked').value;
        if (selectedPrice) newUrl += `price=${selectedPrice}&`;

        window.location.href = newUrl.slice(0, -1); // Bỏ dấu '&' hoặc '?' thừa ở cuối
    };

    // 1. Tải danh mục vào Sidebar và xác định Tên danh mục đang xem
    try {
        const catRes = await fetch('http://127.0.0.1:5000/api/categories');
        const categories = await catRes.json();
        
        let sidebarHtml = `<li><a href="category.html" class="${!categoryId ? 'active' : ''}">Tất cả truyện</a></li>`;
        
        categories.forEach(cat => {
            const catId = cat.id || cat._id;
            const isActive = (catId === categoryId) ? 'active' : '';
            sidebarHtml += `<li><a href="category.html?id=${catId}" class="${isActive}"><i class="fa-solid fa-angle-right" style="font-size: 10px; margin-right: 5px;"></i> ${cat.name}</a></li>`;
            
            // Cập nhật tiêu đề trang nếu khớp ID
            if (isActive) {
                catTitle.textContent = `Truyện thể loại: ${cat.name}`;
                bcCategoryName.textContent = cat.name;
            }
        });
        sidebarCategoryList.innerHTML = sidebarHtml;
    } catch (err) {
        console.error("Lỗi tải danh mục:", err);
    }

    // 2. Thiết lập trạng thái ban đầu cho các bộ lọc
    if (sortParam) catSort.value = sortParam;
    if (priceParam) {
        const radio = document.querySelector(`input[name="priceFilter"][value="${priceParam}"]`);
        if (radio) radio.checked = true;
    }

    // Gắn sự kiện cho các bộ lọc
    catSort.addEventListener('change', applyFilters);
    const priceRadios = document.querySelectorAll('input[name="priceFilter"]');
    priceRadios.forEach(radio => radio.addEventListener('change', applyFilters));

    // 3. Gọi API để tải Lưới truyện (Tái sử dụng siêu API Search)
    try {
        let apiUrl = `http://127.0.0.1:5000/api/search?page=${pageParam}&limit=12`; // Hiện 12 truyện 1 trang
        if (categoryId) apiUrl += `&category=${categoryId}`;
        if (sortParam) apiUrl += `&sort=${sortParam}`;
        if (priceParam) {
            const [min, max] = priceParam.split('-');
            if (min) apiUrl += `&minPrice=${min}`;
            if (max) apiUrl += `&maxPrice=${max}`;
        }
        
        // Fix lỗi truyền thiếu từ khóa (gửi q rỗng để lấy tất cả theo category)
        apiUrl += `&q=`; 

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        const products = data.products || [];
        const totalPages = data.totalPages || 1;
        const currentPage = data.currentPage || 1;

        if (products.length === 0) {
            catGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: #888;">Không có truyện nào thuộc danh mục này.</div>`;
            return;
        }

        // Render HTML Thẻ truyện (Giữ nguyên cấu trúc thả tim và sao)
        catGrid.innerHTML = products.map(item => {
            const productId = item.id;
            const isLiked = typeof globalWishlist !== 'undefined' && globalWishlist.includes(productId);
            const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
            const heartColor = isLiked ? '#e74c3c' : '#ccc';

            let origPrice = item.price;
            let fnPrice = origPrice;
            if (item.discount && item.discount.includes('%')) {
                let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
            }
            const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
            const oldPriceHtml = fnPrice < origPrice ? `<span class="old">${Number(origPrice).toLocaleString()}đ</span>` : '';

            const rating = item.averageRating || 0;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                else starsHtml += '<i class="fa-regular fa-star"></i>';
            }
            
            return `
                <div class="product-card">
                    <div class="wishlist-btn" onclick="toggleWishlist(event, '${productId}')" style="position: absolute; top: 10px; right: 10px; z-index: 999; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;">
                        <i class="${heartClass} fa-heart" style="color: ${heartColor}; transition: 0.2s;"></i>
                    </div>
                    <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit;">
                        <div class="img-box">
                            <img src="${item.imageUrl}" onerror="this.src='https://placehold.jp/200x250.png?text=No+Image'">
                        </div>
                        <div class="info-box">
                            <h3 class="name">${item.productName || item.name}</h3>
                            <div class="author" style="font-size: 13px; margin-bottom: 8px;">${item.authorName || 'Đang cập nhật'}</div>
                            <div class="stars">${starsHtml} <span class="sold-count">| Đã bán ${item.sold || 0}</span></div>
                            <div class="price-group"><span class="now">${priceFormatted}</span> ${oldPriceHtml}</div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        // 4. Render Phân trang
        const paginationContainer = document.getElementById('catPagination');
        if (paginationContainer && totalPages > 1) {
            let paginationHtml = '';
            const getPageUrl = (page) => {
                let url = `category.html?`;
                if (categoryId) url += `id=${categoryId}&`;
                if (sortParam) url += `sort=${sortParam}&`;
                if (priceParam) url += `price=${priceParam}&`;
                url += `page=${page}`;
                return url;
            };

            if (currentPage > 1) paginationHtml += `<a href="${getPageUrl(currentPage - 1)}" class="pagination-btn">&laquo; Trang trước</a>`;
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) paginationHtml += `<a href="#" class="pagination-btn active" onclick="event.preventDefault()">${i}</a>`;
                else paginationHtml += `<a href="${getPageUrl(i)}" class="pagination-btn">${i}</a>`;
            }

            if (currentPage < totalPages) paginationHtml += `<a href="${getPageUrl(currentPage + 1)}" class="pagination-btn">Trang tiếp &raquo;</a>`;
            paginationContainer.innerHTML = paginationHtml;
        }

    } catch (error) {
        console.error("Lỗi tải lưới truyện:", error);
        catGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">Có lỗi xảy ra khi tải dữ liệu.</p>`;
    }
});