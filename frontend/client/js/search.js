document.addEventListener('DOMContentLoaded', async () => {
    const searchGrid = document.getElementById('searchGrid');
    const searchTitle = document.getElementById('searchTitle');
    
    // Các DOM Element của bộ lọc mới
    const menuCategoryFilter = document.getElementById('menuCategoryFilter');
    const textCategoryFilter = document.getElementById('textCategoryFilter');
    
    const menuPriceFilter = document.getElementById('menuPriceFilter');
    const textPriceFilter = document.getElementById('textPriceFilter');
    
    const menuSortFilter = document.getElementById('menuSortFilter');
    const textSortFilter = document.getElementById('textSortFilter');
    
    // 1. Lấy từ khóa "q" từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    let currentCategoryId = urlParams.get('category') || '';
    let currentSortParam = urlParams.get('sort') || '';
    let currentPriceParam = urlParams.get('price') || '';
    const pageParam = parseInt(urlParams.get('page')) || 1;

    if (query) {
        searchTitle.innerHTML = `Kết quả tìm kiếm cho: <span>"${query}"</span>`;
    } else {
        searchTitle.innerHTML = `Tất cả truyện tranh`;
    }

    try {
        // 2. Tải danh sách thể loại cho thanh lọc (Dropdown)
        if (menuCategoryFilter) {
            const catRes = await fetch('http://127.0.0.1:5000/api/categories');
            const categories = await catRes.json();
            
            let html = `<li><a href="#" data-value="">Tất cả thể loại</a></li>`;
            categories.forEach(cat => {
                const id = cat.id || cat._id;
                html += `<li><a href="#" data-value="${id}">${cat.name}</a></li>`;
                if (String(id) === currentCategoryId) {
                    textCategoryFilter.textContent = cat.name;
                    if (!query) searchTitle.innerHTML = `Thể loại: <span>${cat.name}</span>`;
                }
            });
            menuCategoryFilter.innerHTML = html;
        }

        // 3. Set text ban đầu cho Lọc Giá và Sắp xếp
        if (currentPriceParam && menuPriceFilter) {
            const el = menuPriceFilter.querySelector(`a[data-value="${currentPriceParam}"]`);
            if (el) textPriceFilter.textContent = el.textContent;
        }
        if (currentSortParam && menuSortFilter) {
            const el = menuSortFilter.querySelector(`a[data-value="${currentSortParam}"]`);
            if (el) textSortFilter.textContent = el.textContent;
        }

        // --- LOGIC ĐÓNG / MỞ MENU DROPDOWN ---
        const filterWrappers = document.querySelectorAll('.filter-dropdown-wrapper');
        filterWrappers.forEach(wrapper => {
            const btn = wrapper.querySelector('.filter-btn');
            const popup = wrapper.querySelector('.filter-popup');
            
            if (btn && popup) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = popup.classList.contains('show');
                    
                    // Đóng tất cả các menu đang mở trước
                    document.querySelectorAll('.filter-popup').forEach(p => p.classList.remove('show'));
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    
                    if (!isOpen) {
                        popup.classList.add('show');
                        btn.classList.add('active');
                    }
                });
            }
        });

        // Đóng menu khi click ra ngoài
        document.addEventListener('click', () => {
            document.querySelectorAll('.filter-popup').forEach(p => p.classList.remove('show'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        });

        // Hàm gộp chung logic điều hướng khi có bất kỳ bộ lọc nào thay đổi
        function applyFilters() {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            
            if (currentCategoryId) params.set('category', currentCategoryId);
            if (currentSortParam) params.set('sort', currentSortParam);
            if (currentPriceParam) params.set('price', currentPriceParam);
            
            window.location.href = `search.html?${params.toString()}`;
        }

        // Bắt sự kiện chọn Option bên trong Menu
        document.querySelectorAll('.filter-popup').forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('a');
                if (target) {
                    const value = target.getAttribute('data-value');
                    
                    if (menu.id === 'menuCategoryFilter') {
                        currentCategoryId = value;
                    } else if (menu.id === 'menuPriceFilter') {
                        currentPriceParam = value;
                    } else if (menu.id === 'menuSortFilter') {
                        currentSortParam = value;
                    }
                    
                    applyFilters(); // Redirect
                }
            });
        });

        // Tải wishlist để đồng bộ tim đỏ trên thẻ truyện
        if (typeof fetchUserWishlist === 'function') {
            await fetchUserWishlist();
        }

        // 4. Gọi API tìm kiếm (Sử dụng cổng 5000)
        let apiUrl = `http://127.0.0.1:5000/api/search?page=${pageParam}`;
        if (query) apiUrl += `&q=${encodeURIComponent(query)}`;
        if (currentCategoryId) apiUrl += `&category=${currentCategoryId}`;
        if (currentSortParam) apiUrl += `&sort=${currentSortParam}`;
        if (currentPriceParam) {
            const [min, max] = currentPriceParam.split('-');
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
            searchGrid.innerHTML = `<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: #666; font-size: 16px;">Rất tiếc, không tìm thấy truyện nào khớp với bộ lọc của bạn.</div>`;
            return;
        }

        // 5. Vẽ kết quả (Dùng chung Class product-card để ăn CSS cũ)
        searchGrid.innerHTML = products.map(item => {
            const productId = item.id;

            // Check trạng thái yêu thích
            const isLiked = typeof globalWishlist !== 'undefined' && globalWishlist.includes(String(productId));
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
                <div class="product-card" style="position: relative;">
                    <div class="wishlist-btn" onclick="toggleWishlist(event, '${productId}')" style="position: absolute; top: 10px; right: 10px; z-index: 999; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;">
                        <i class="${heartClass} fa-heart" style="color: ${heartColor}; transition: 0.2s;"></i>
                    </div>

                    <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit;">
                        <div class="img-box">
                            ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                            <img src="${item.imageUrl}" onerror="this.src='https://placehold.jp/200x250.png?text=No+Image'">
                        </div>
                        <div class="info-box">
                            <h3 class="name">${item.productName || item.name}</h3>
                            <div class="author" style="font-size: 13px; margin-bottom: 8px;">
                                ${item.authorName ? 
                                    `<span style="color: #007bff; cursor: pointer; text-decoration: none;" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='search.html?q=${encodeURIComponent(item.authorName)}';" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                        <i class="fa-solid fa-pen-nib"></i> ${item.authorName}
                                    </span>` 
                                    : '<span style="color: #666;">Đang cập nhật</span>'
                                }
                            </div>
                            <div class="stars">
                                ${starsHtml} <span style="color: #888; font-size: 11px; margin-left: 5px;">(${item.totalReviews || 0})</span> <span class="sold-count" style="color: #757575; font-size: 11px; margin-left: 5px;">| Đã bán ${item.sold || 0}</span>
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
                const pParams = new URLSearchParams(window.location.search);
                pParams.set('page', page);
                return `search.html?${pParams.toString()}`;
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