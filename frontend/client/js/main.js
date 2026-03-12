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
    // 1. QUẢN LÝ CÁC MENU THẢ XUỐNG (DROPDOWNS)
    // ==========================================
    // Hàm dùng chung để đóng tất cả các menu đang mở
    function closeAllDropdowns() {
        if (categoryMenu) categoryMenu.classList.remove('show');
        if (categoryBtn) categoryBtn.classList.remove('active');
        if (notiDropdown) notiDropdown.classList.remove('show');
        if (accountDropdown) accountDropdown.classList.remove('show');
        if (searchResults) searchResults.classList.remove('show');
    }

    // Toggle Danh mục
    if (categoryBtn && categoryMenu) {
        categoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = categoryMenu.classList.contains('show');
            closeAllDropdowns(); // Đóng các cái khác trước
            if (!isOpen) {
                categoryMenu.classList.add('show');
                categoryBtn.classList.add('active');
            }
        });
    }

    // Toggle Thông báo
    if (notiBtn && notiDropdown) {
        notiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notiDropdown.classList.contains('show');
            closeAllDropdowns();
            if (!isOpen) notiDropdown.classList.add('show');
        });
    }

    // Toggle Tài khoản
    if (accountBtn && accountDropdown) {
        accountBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = accountDropdown.classList.contains('show');
            closeAllDropdowns();
            if (!isOpen) accountDropdown.classList.add('show');
        });
    }

    // Click ra ngoài thì đóng hết
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    // Ngăn việc click bên trong bảng menu làm nó bị đóng
    [categoryMenu, notiDropdown, accountDropdown, searchResults].forEach(menu => {
        if (menu) {
            menu.addEventListener('click', (e) => e.stopPropagation());
        }
    });

    // ==========================================
    // 2. TỰ ĐỘNG TẢI DANH MỤC VÀ BEST SELLER
    // ==========================================
    async function loadCategories() {
        if (!categoryMenu) return;
        try {
            const response = await fetch('http://localhost:5000/api/categories');
            const categories = await response.json();
            categoryMenu.innerHTML = categories.map(cat => `
                <li>
                    <a href="category.html?id=${cat.id}">
                        <i class="fa-solid fa-tags"></i> ${cat.name}
                    </a>
                </li>
            `).join('');
        } catch (error) { console.error("Lỗi tải danh mục:", error); }
    }

    async function loadBestSellers() {
        if (!track) return;
        try {
            const response = await fetch('http://localhost:5000/api/products/best-sellers');
            const products = await response.json();
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
        } catch (error) { console.error("Lỗi Best Seller:", error); }
    }

    // ==========================================
    // 3. XỬ LÝ TÌM KIẾM (LIVE SEARCH & BUTTON CLICK)
    // ==========================================
    let timeoutId;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim();
            if (keyword.length === 0) {
                searchResults.classList.remove('show');
                return;
            }
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(keyword)}`);
                    const products = await response.json();
                    if (products.length > 0) {
                        searchResults.innerHTML = products.map(item => `
                            <a href="#" class="search-item">
                                <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2255%22%20viewBox%3D%220%200%2040%2055%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e0e0e0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-size%3D%2210%22%20fill%3D%22%23888888%22%3EImg%3C%2Ftext%3E%3C%2Fsvg%3E';" alt="${item.productName}">
                                <div class="search-info">
                                    <div class="s-name">${item.productName}</div>
                                    <div class="s-author"><i class="fa-solid fa-pen-nib"></i> ${item.authorName || 'Đang cập nhật'}</div>
                                    <div class="s-price">${Number(item.price).toLocaleString()}đ</div>
                                </div>
                            </a>
                        `).join('');
                        searchResults.classList.add('show');
                    }
                } catch (error) { console.error("Lỗi tìm kiếm:", error); }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('show');
            }
        });
    }
    // ==========================================
    // 4. LOGIC CAROUSEL & KHỞI CHẠY
    // ==========================================
    function initCarousel(originalLength) {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        if (!track || !nextBtn || !prevBtn || originalLength === 0) return;

        const cards = Array.from(track.children);
        const cardWidth = cards[0].offsetWidth + 20; 
        let index = 0;

        cards.forEach(card => track.appendChild(card.cloneNode(true)));

        function updateSlider() {
            track.style.transition = "transform 0.5s ease-in-out";
            track.style.transform = `translateX(-${index * cardWidth}px)`;
            if (index >= originalLength) {
                setTimeout(() => {
                    track.style.transition = "none";
                    index = 0;
                    track.style.transform = `translateX(0)`;
                }, 500);
            }
        }
        nextBtn.onclick = () => { index++; updateSlider(); };
        prevBtn.onclick = () => {
            if (index <= 0) {
                index = originalLength;
                track.style.transition = "none";
                track.style.transform = `translateX(-${index * cardWidth}px)`;
                track.offsetWidth; 
            }
            index--;
            updateSlider();
        };
    }

    // Chạy các hàm tải dữ liệu ban đầu
    loadCategories();
    loadBestSellers();
});





