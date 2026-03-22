document.addEventListener('DOMContentLoaded', async () => {
    const searchGrid = document.getElementById('searchGrid');
    const searchTitle = document.getElementById('searchTitle');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    // 1. Lấy từ khóa "q" từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const categoryId = urlParams.get('category');
    const sortParam = urlParams.get('sort');
    const priceParam = urlParams.get('price');
    const pageParam = parseInt(urlParams.get('page')) || 1;

    if (!query) {
        searchTitle.textContent = "Bạn chưa nhập từ khóa tìm kiếm.";
        return;
    }

    searchTitle.innerHTML = `Kết quả tìm kiếm cho: <span>"${query}"</span>`;

    try {
        // 2. Tải danh sách thể loại cho thanh lọc (Dropdown)
        if (categoryFilter) {
            const catRes = await fetch('http://127.0.0.1:5000/api/categories');
            const categories = await catRes.json();
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id || cat._id;
                option.textContent = cat.name;
                if (String(cat.id || cat._id) === categoryId) {
                    option.selected = true;
                }
                categoryFilter.appendChild(option);
            });

            categoryFilter.addEventListener('change', applyFilters);
        }

        // 3. Xử lý bộ lọc sắp xếp & khoảng giá
        if (sortFilter) {
            if (sortParam) sortFilter.value = sortParam;
            sortFilter.addEventListener('change', applyFilters);
        }

        if (priceFilter) {
            if (priceParam) priceFilter.value = priceParam;
            priceFilter.addEventListener('change', applyFilters);
        }

        // Hàm gộp chung logic điều hướng khi có bất kỳ bộ lọc nào thay đổi
        function applyFilters() {
            const selectedCat = categoryFilter ? categoryFilter.value : '';
            const currentSort = sortFilter ? sortFilter.value : '';
            const currentPrice = priceFilter ? priceFilter.value : '';
            let newUrl = `search.html?q=${encodeURIComponent(query)}`;
            if (selectedCat) newUrl += `&category=${selectedCat}`;
            if (currentSort) newUrl += `&sort=${currentSort}`;
            if (currentPrice) newUrl += `&price=${currentPrice}`;
            window.location.href = newUrl;
        }

        // 4. Gọi API tìm kiếm (Sử dụng cổng 5000)
        let apiUrl = `http://127.0.0.1:5000/api/search?q=${encodeURIComponent(query)}&page=${pageParam}`;
        if (categoryId) apiUrl += `&category=${categoryId}`;
        if (sortParam) apiUrl += `&sort=${sortParam}`;
        if (priceParam) {
            const [min, max] = priceParam.split('-');
            if (min) apiUrl += `&minPrice=${min}`;
            if (max) apiUrl += `&maxPrice=${max}`;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Lấy danh sách sản phẩm và thông tin phân trang từ API
        const products = data.products || [];
        const totalPages = data.totalPages || 1;
        const currentPage = data.currentPage || 1;

        if (products.length === 0) {
            searchGrid.innerHTML = `<div class="no-results">Rất tiếc, không tìm thấy truyện nào khớp với từ khóa của bạn.</div>`;
            return;
        }

        // 5. Vẽ kết quả (Dùng chung Class product-card để ăn CSS cũ)
        searchGrid.innerHTML = products.map(item => {
            const productId = item.id;

            let origPrice = item.price;
            let fnPrice = origPrice;
            if (item.discount && item.discount.includes('%')) {
                let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
            }
            const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
            const oldPriceHtml = fnPrice < origPrice ? `<span class="old">${Number(origPrice).toLocaleString()}đ</span>` : '';

            // Render số sao và lượt bán dựa trên Database thực tế
            const rating = item.averageRating || 0;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) {
                    starsHtml += '<i class="fa-solid fa-star"></i>';
                } else if (i - 0.5 <= rating) {
                    starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                } else {
                    starsHtml += '<i class="fa-regular fa-star"></i>';
                }
            }
            
            return `
                <div class="product-card">
                    <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit;">
                        <div class="img-box">
                            <img src="${item.imageUrl}" onerror="this.src='https://placehold.jp/200x250.png?text=No+Image'">
                        </div>
                        <div class="info-box">
                            <h3 class="name">${item.productName || item.name}</h3>
                            <div class="author" style="font-size: 13px; margin-bottom: 8px;">
                                ${item.authorName ? 
                                    `<span style="color: #007bff; cursor: pointer; text-decoration: none;" onclick="event.preventDefault(); window.location.href='search.html?q=${encodeURIComponent(item.authorName)}';" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                        <i class="fa-solid fa-pen-nib"></i> ${item.authorName}
                                    </span>` 
                                    : '<span style="color: #666;">Đang cập nhật</span>'
                                }
                            </div>
                            <div class="stars">
                                ${starsHtml} <span class="sold-count" style="color: #757575; font-size: 11px; margin-left: 5px;">| Đã bán ${item.sold || 0}</span>
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

        // 6. Vẽ các nút phân trang (Chỉ hiển thị nếu lớn hơn 1 trang)
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer && totalPages > 1) {
            let paginationHtml = '';

            // Hàm hỗ trợ tạo URL cho trang
            const getPageUrl = (page) => {
                let url = `search.html?q=${encodeURIComponent(query)}`;
                if (categoryId) url += `&category=${categoryId}`;
                if (sortParam) url += `&sort=${sortParam}`;
                if (priceParam) url += `&price=${priceParam}`;
                url += `&page=${page}`;
                return url;
            };

            // Nút Trang trước (Chỉ hiện nếu không phải trang 1)
            if (currentPage > 1) {
                paginationHtml += `<a href="${getPageUrl(currentPage - 1)}" class="pagination-btn">&laquo; Trang trước</a>`;
            }

            // Nút số thứ tự có thu gọn
            let pages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (currentPage <= 4) {
                    pages = [1, 2, 3, 4, 5, '...', totalPages];
                } else if (currentPage >= totalPages - 3) {
                    pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                } else {
                    pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                }
            }

            pages.forEach(i => {
                if (i === '...') {
                    paginationHtml += `<span class="pagination-ellipsis" style="padding: 8px 12px; color: #888;">...</span>`;
                } else if (i === currentPage) {
                    paginationHtml += `<a href="#" class="pagination-btn active" onclick="event.preventDefault()">${i}</a>`;
                } else {
                    paginationHtml += `<a href="${getPageUrl(i)}" class="pagination-btn">${i}</a>`;
                }
            });

            // Nút Trang tiếp (Chỉ hiện nếu chưa ở trang cuối)
            if (currentPage < totalPages) {
                paginationHtml += `<a href="${getPageUrl(currentPage + 1)}" class="pagination-btn">Trang tiếp &raquo;</a>`;
            }

            paginationContainer.innerHTML = paginationHtml;
        }

    } catch (error) {
        console.error("Lỗi trang search:", error);
        searchGrid.innerHTML = `<p>Có lỗi xảy ra khi tải dữ liệu.</p>`;
    }
});