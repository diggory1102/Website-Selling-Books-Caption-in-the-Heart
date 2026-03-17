// ==========================================
// CÁC HÀM TOÀN CỤC (GLOBAL FUNCTIONS)
// Bắt buộc để ngoài cùng để HTML nhận diện được
// ==========================================

// 2. Hàm xử lý khi bấm nút trái tim
function toggleWishlist(event, productId) {
    event.preventDefault(); 
    event.stopPropagation();

    // CHẶN KHÁCH VÃNG LAI
    const isLogged = localStorage.getItem('currentUser');
    if (!isLogged) {
        alert("Vui lòng đăng nhập tài khoản để lưu truyện yêu thích nhé!");
        window.location.href = "login.html";
        return;
    }

    const heartIcon = event.currentTarget.querySelector('i');
    let wishlist = JSON.parse(localStorage.getItem('user_wishlist')) || [];
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
        heartIcon.classList.remove('fa-solid');
        heartIcon.classList.add('fa-regular');
        heartIcon.style.color = '#ccc';
    } else {
        wishlist.push(productId);
        heartIcon.classList.remove('fa-regular');
        heartIcon.classList.add('fa-solid');
        heartIcon.style.color = '#e74c3c';
    }
    
    localStorage.setItem('user_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

// 3. Hàm cập nhật con số trên nút Yêu thích ở Header
function updateWishlistCount() {
    const wishlist = JSON.parse(localStorage.getItem('user_wishlist')) || [];
    const wishlistBadge = document.querySelector('a[href="wishlist.html"] .cart-count');
    if (wishlistBadge) {
        wishlistBadge.textContent = wishlist.length;
    }
}

// ==========================================
// KHI TRANG ĐÃ TẢI XONG BẮT ĐẦU CHẠY (DOM LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- LƯU THÔNG TIN ĐĂNG NHẬP TỪ GOOGLE/FACEBOOK ---
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const socialUser = urlParams.get('socialUser');
    
    if (userParam || socialUser) {
        localStorage.setItem('currentUser', decodeURIComponent(userParam || socialUser));
        window.history.replaceState({}, document.title, window.location.pathname);
    }

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
    
    // 1. QUẢN LÝ CÁC MENU THẢ XUỐNG
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
        if (!e.target.closest('.header-left') && !e.target.closest('.icon-group')) {
            closeAllDropdowns();
        }
    });

    // 2. TẢI DANH MỤC
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
            categoryMenu.innerHTML = '<li><a href="#">Lỗi kết nối Server</a></li>';
        }
    }

    // 3. TẢI SẢN PHẨM BEST SELLERS VÀ VẼ GIAO DIỆN
    async function loadBestSellers() {
        if (!track) return;
        try {
            const response = await fetch('http://127.0.0.1:5000/api/products/best-sellers');
            const products = await response.json();
            
            if (!products || products.length === 0) {
                track.innerHTML = '<p>Đang cập nhật truyện...</p>';
                return;
            }

            const wishlist = JSON.parse(localStorage.getItem('user_wishlist')) || [];

            track.innerHTML = products.map(item => {
                const isLiked = wishlist.includes(item.id);
                const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
                const heartColor = isLiked ? '#e74c3c' : '#ccc';

                return `
                <div class="product-card" style="position: relative;">
                    
                    <div class="wishlist-btn" onclick="toggleWishlist(event, '${item.id}')" style="position: absolute; top: 10px; right: 10px; z-index: 999; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;">
                        <i class="${heartClass} fa-heart" style="color: ${heartColor}; transition: 0.2s;"></i>
                    </div>

                    <a href="product-detail.html?id=${item.id}" style="text-decoration: none; color: inherit; display: block;">
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
                    </a>
                </div>
                `;
            }).join('');

            initCarousel(products.length); 
        } catch (error) { 
            console.error("Lỗi Best Seller:", error); 
        }
    }

    // 4. XỬ LÝ TÌM KIẾM
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
                            <div class="search-item" onclick="window.location.href='product-detail.html?id=${item.id}'">
                                <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='https://placehold.co/50x70?text=No+Img';">
                                <div class="search-info">
                                    <h4>${item.productName || item.name}</h4>
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

    // 5. CAROUSEL
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

    // 6. CHECK LOGIN STATUS & PHÂN QUYỀN
    function checkLoginStatus() {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const accountList = document.querySelector('.account-list');
        
        const notiBtn = document.getElementById('notiBtn');
        const cartBtn = document.getElementById('cartBtn');
        const wishlistBtn = document.querySelector('.user-actions a[href="wishlist.html"]');
        
        const userStr = localStorage.getItem('currentUser');
        
        if (userStr) {
            const user = JSON.parse(userStr);
            if (notiBtn) notiBtn.style.display = '';
            if (cartBtn) cartBtn.style.display = '';
            if (wishlistBtn) wishlistBtn.style.display = '';

            const avatarUrl = user.picture || user.avatar || user.photo; 
            if (userNameDisplay) userNameDisplay.textContent = `Chào, ${user.fullName || user.userName || user.name || 'Thành viên'}`;
            if (userRoleDisplay) userRoleDisplay.textContent = "Khách hàng thành viên";
            
            if (avatarUrl) {
                const accountIconWrap = document.querySelector('#accountBtn .icon-wrap');
                if (accountIconWrap) {
                    accountIconWrap.innerHTML = `<img src="${avatarUrl}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd;">`;
                }

                const accountHeader = document.querySelector('.account-header');
                if (accountHeader) {
                    accountHeader.style.display = 'flex';
                    accountHeader.style.alignItems = 'center';
                    accountHeader.style.gap = '12px';
                    accountHeader.innerHTML = `
                        <img src="${avatarUrl}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color);">
                        <div>
                            <strong id="userNameDisplay">Chào, ${user.fullName || user.userName || user.name || 'Thành viên'}</strong> 
                            <span id="userRoleDisplay" style="font-size: 12px; color: #888; display: block; margin-top: 3px;">Khách hàng thành viên</span>
                        </div>
                    `;
                }
            }

            if (accountList) {
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
            if (notiBtn) notiBtn.style.display = 'none';
            if (cartBtn) cartBtn.style.display = 'none';
            if (wishlistBtn) wishlistBtn.style.display = 'none';

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
    // KHỞI CHẠY TẤT CẢ CÁC HÀM
    // ==========================================
    updateWishlistCount();
    loadCategories();
    loadBestSellers();
    checkLoginStatus(); 
});