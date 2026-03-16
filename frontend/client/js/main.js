document.addEventListener('DOMContentLoaded', function() {
    // --- KHAI BÁO CÁC PHẦN TỬ ---
    const categoryBtn = document.getElementById('categoryBtn');
    const categoryMenu = document.getElementById('categoryMenu');
    const notiBtn = document.getElementById('notiBtn');
    const notiDropdown = document.getElementById('notiDropdown');
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const track = document.getElementById('productTrack');

    // ==========================================
    // 1. QUẢN LÝ CÁC MENU THẢ XUỐNG
    // ==========================================
    function closeAllDropdowns() {
        if (categoryMenu) categoryMenu.classList.remove('show');
        if (categoryBtn) categoryBtn.classList.remove('active');
        if (notiDropdown) notiDropdown.classList.remove('show');
        if (accountDropdown) accountDropdown.classList.remove('show');
        if (searchResults) searchResults.classList.remove('show');
    }

    const setupToggle = (btn, dropdown) => {
        if (btn && dropdown) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('show');
                closeAllDropdowns();
                if (!isOpen) {
                    dropdown.classList.add('show');
                    if (btn === categoryBtn) btn.classList.add('active');
                }
            });
        }
    };

    setupToggle(categoryBtn, categoryMenu);
    setupToggle(notiBtn, notiDropdown);
    setupToggle(accountBtn, accountDropdown);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            if (searchResults) searchResults.classList.remove('show');
        }
        if (!e.target.closest('.header-left') && 
            !e.target.closest('.icon-group')) {
            closeAllDropdowns();
        }
    });

    // ==========================================
    // 2. TẢI DANH MỤC TỪ BACKEND
    // ==========================================
    async function loadCategories() {
        if (!categoryMenu) return;
        try {
            // ĐÃ SỬA: localhost -> 127.0.0.1
            const response = await fetch(`http://127.0.0.1:5000/api/categories?t=${Date.now()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const categories = await response.json();
            
            if (categories && categories.length > 0) {
                categoryMenu.innerHTML = categories.map(cat => 
                    `<li><a href="category.html?id=${cat.id}">${cat.name}</a></li>`
                ).join('');
                console.log("✅ Đã đồng bộ Danh mục từ DB");
            } else {
                categoryMenu.innerHTML = '<li><a href="#">Đang cập nhật...</a></li>';
            }
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
            categoryMenu.innerHTML = '<li><a href="#">Lỗi kết nối Server</a></li>';
        }
    }

    // ==========================================
    // 3. TẢI SẢN PHẨM BEST SELLERS
    // ==========================================
    async function loadBestSellers() {
        if (!track) return;
        try {
            // ĐÃ SỬA: localhost -> 127.0.0.1
            const response = await fetch('http://127.0.0.1:5000/api/products/best-sellers');
            const products = await response.json();
            
            if (!products || products.length === 0) {
                track.innerHTML = '<p>Đang cập nhật truyện...</p>';
                return;
            }

            track.innerHTML = products.map(item => `
                <div class="product-card">
                    <div class="img-box">
                        ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                        <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22250%22%20viewBox%3D%220%200%20200%20250%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2214%22%20fill%3D%22%23999%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';" alt="${item.name}">
                    </div>
                    <div class="info-box">
                        <h3 class="name">${item.name}</h3>
                        <div class="stars">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                            <span class="sold-count">| Đã bán ${item.sold || 0}</span>
                        </div>
                        <div class="price-group">
                            <span class="now">${Number(item.price).toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>
            `).join('');

            initCarousel(products.length); 
            console.log("✅ Đã tải xong Best Sellers");
        } catch (error) { 
            console.error("Lỗi Best Seller:", error); 
        }
    }

    // ==========================================
    // 4. XỬ LÝ TÌM KIẾM (LIVE SEARCH)
    // ==========================================
    if (searchInput && searchResults) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim();
            if (keyword.length === 0) {
                searchResults.classList.remove('show');
                return;
            }
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                try {
                    // ĐÃ SỬA: localhost -> 127.0.0.1
                    const response = await fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(keyword)}`);
                    const products = await response.json();

                    if (products.length > 0) {
                        searchResults.innerHTML = products.map(item => `
                            <div class="search-item" onclick="window.location.href='detail.html?id=${item.id}'">
                                <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22250%22%20viewBox%3D%220%200%20200%20250%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2214%22%20fill%3D%22%23999%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';" alt="${item.name}">
                                <div class="search-info">
                                    <h4>${item.productName}</h4>
                                    <p class="author">${item.authorName || 'Đang cập nhật'}</p>
                                    <p class="price">${Number(item.price).toLocaleString()}đ</p>
                                </div>
                            </div>
                        `).join('') + `<div class="search-more"><a href="search.html?q=${encodeURIComponent(keyword)}">Xem tất cả kết quả</a></div>`;
                    } else {
                        searchResults.innerHTML = `<div class="search-empty">Không tìm thấy "${keyword}"</div>`;
                    }
                    searchResults.classList.add('show');
                } catch (err) {
                    console.error("Lỗi tìm kiếm:", err);
                }
            }, 300); // Đợi 300ms sau khi ngừng gõ mới gọi API
        });
    }

    // ==========================================
    // 5. CAROUSEL TRƯỢT
    // ==========================================
    function initCarousel(originalLength) {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        if (!track || !nextBtn || !prevBtn || originalLength === 0) return;

        let cardWidth = track.querySelector('.product-card').offsetWidth + 20;
        let index = 0;

        const cards = Array.from(track.children);
        cards.forEach(card => track.appendChild(card.cloneNode(true)));

        const moveSlider = () => {
            track.style.transition = "transform 0.5s ease-in-out";
            track.style.transform = `translateX(-${index * cardWidth}px)`;
        };

        track.addEventListener('transitionend', () => {
            if (index >= originalLength) {
                track.style.transition = "none";
                index = 0;
                track.style.transform = `translateX(0)`;
            }
            if (index < 0) {
                track.style.transition = "none";
                index = originalLength - 1;
                track.style.transform = `translateX(-${index * cardWidth}px)`;
            }
        });

        nextBtn.onclick = () => { index++; moveSlider(); };
        prevBtn.onclick = () => { index--; moveSlider(); };
    }

    // ==========================================
    // KHỞI CHẠY KHI VÀO TRANG
    // ==========================================
    loadCategories();
    loadBestSellers();
});