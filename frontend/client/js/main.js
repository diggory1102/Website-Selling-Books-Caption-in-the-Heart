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
    const cartBtn = document.getElementById('cartBtn');
    const cartDropdown = document.getElementById('cartDropdown');

    // ==========================================
    // 1. QUẢN LÝ CÁC MENU THẢ XUỐNG
    // ==========================================
    function closeAllDropdowns() {
        if (categoryMenu) categoryMenu.classList.remove('show');
        if (categoryBtn) categoryBtn.classList.remove('active');
        if (notiDropdown) notiDropdown.classList.remove('show');
        if (accountDropdown) accountDropdown.classList.remove('show');
        if (searchResults) searchResults.classList.remove('show');
        if (cartDropdown) cartDropdown.classList.remove('show');
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
    setupToggle(cartBtn, cartDropdown);

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
            const response = await fetch(`http://127.0.0.1:5000/api/categories?t=${Date.now()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const categories = await response.json();
            
            if (categories && categories.length > 0) {
                categoryMenu.innerHTML = categories.map(cat => 
                    `<li><a href="category.html?id=${cat.id}">${cat.name}</a></li>`
                ).join('');
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
                        <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='https://placehold.co/200x250?text=No+Image';" alt="${item.name}">
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
                    const response = await fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(keyword)}`);
                    const products = await response.json();

                    if (products.length > 0) {
                        searchResults.innerHTML = products.map(item => `
                            <div class="search-item" onclick="window.location.href='detail.html?id=${item.id}'">
                                <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='https://placehold.co/50x70?text=No+Img';">
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
            }, 300);
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
    // 6. KIỂM TRA ĐĂNG NHẬP VÀ ĐỔI MENU TÀI KHOẢN
    // ==========================================
    function checkLoginStatus() {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const accountList = document.querySelector('.account-list');
        
        const userStr = localStorage.getItem('currentUser');
        
        if (userStr) {
            // ---> TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP
            const user = JSON.parse(userStr);
            
            if (userNameDisplay) userNameDisplay.textContent = `Chào, ${user.fullName || user.userName}`;
            if (userRoleDisplay) userRoleDisplay.textContent = "Khách hàng thành viên";
            
            if (accountList) {
                // ĐÃ THÊM DANH SÁCH YÊU THÍCH VÀO ĐÂY
                accountList.innerHTML = `
                    <a href="profile.html" class="account-item"><i class="fa-solid fa-address-card"></i> Hồ sơ của tôi</a>
                    <a href="orders.html" class="account-item"><i class="fa-solid fa-box-open"></i> Đơn hàng của tôi</a>
                    <a href="wishlist.html" class="account-item"><i class="fa-solid fa-heart"></i> Danh sách yêu thích</a>
                    <a href="#" class="account-item text-danger" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</a>
                `;

                document.getElementById('logoutBtn').addEventListener('click', function(e) {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    window.location.reload(); 
                });
            }
        } else {
            // ---> TRƯỜNG HỢP 2: LÀ KHÁCH (CHƯA ĐĂNG NHẬP)
            if (userNameDisplay) userNameDisplay.textContent = "Chào, Khách";
            if (userRoleDisplay) userRoleDisplay.textContent = "Vui lòng đăng nhập";
            
            if (accountList) {
                accountList.innerHTML = `
                    <a href="login.html" class="account-item"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập</a>
                    <a href="signup.html" class="account-item"><i class="fa-solid fa-user-plus"></i> Đăng ký</a>
                `;
            }
        }
    }

    // ==========================================
    // 6. KIỂM TRA ĐĂNG NHẬP VÀ ĐỔI MENU TÀI KHOẢN
    // ==========================================
    function checkLoginStatus() {
        // --- ĐOẠN MÃ MỚI: Bắt dữ liệu từ Google/Facebook trả về trên URL ---
        const urlParams = new URLSearchParams(window.location.search);
        const socialUser = urlParams.get('socialUser');
        if (socialUser) {
            // Lưu vào bộ nhớ
            localStorage.setItem('currentUser', decodeURIComponent(socialUser));
            // Xóa đoạn loằng ngoằng trên thanh địa chỉ đi cho đẹp
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        // -------------------------------------------------------------------

        const userNameDisplay = document.getElementById('userNameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const accountList = document.querySelector('.account-list');
        
        const userStr = localStorage.getItem('currentUser');
        
        if (userStr) {
            const user = JSON.parse(userStr);
            if (userNameDisplay) userNameDisplay.textContent = `Chào, ${user.fullName || user.userName}`;
            if (userRoleDisplay) userRoleDisplay.textContent = "Khách hàng thành viên";
            
            if (accountList) {
                accountList.innerHTML = `
                    <a href="profile.html" class="account-item"><i class="fa-solid fa-address-card"></i> Hồ sơ của tôi</a>
                    <a href="orders.html" class="account-item"><i class="fa-solid fa-box-open"></i> Đơn hàng của tôi</a>
                    <a href="wishlist.html" class="account-item"><i class="fa-solid fa-heart"></i> Danh sách yêu thích</a>
                    <a href="#" class="account-item" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</a>
                `;

                document.getElementById('logoutBtn').addEventListener('click', function(e) {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    window.location.reload(); 
                });
            }
        } else {
            if (userNameDisplay) userNameDisplay.textContent = "Chào, Khách";
            if (userRoleDisplay) userRoleDisplay.textContent = "Vui lòng đăng nhập";
            
            if (accountList) {
                accountList.innerHTML = `
                    <a href="login.html" class="account-item"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập</a>
                    <a href="signup.html" class="account-item"><i class="fa-solid fa-user-plus"></i> Đăng ký</a>
                `;
            }
        }
    }

    // ==========================================
    // KHỞI CHẠY CÁC HÀM KHI VÀO TRANG
    // ==========================================
    loadCategories();
    loadBestSellers();
    checkLoginStatus(); // Gọi hàm kiểm tra đăng nhập
});