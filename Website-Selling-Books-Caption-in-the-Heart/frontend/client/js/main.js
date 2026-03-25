// ==========================================
// CÁC HÀM TOÀN CỤC (GLOBAL FUNCTIONS)
// ==========================================

// KỸ THUẬT NÂNG CAO: Ghi đè hàm localStorage.setItem để tự động đồng bộ Giỏ hàng lên Server
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments); // Vẫn lưu vào LocalStorage để UI mượt mà
    
    // Nếu đây là giỏ hàng của user đã đăng nhập, tự động ném lên MongoDB
    if (key.startsWith('user_cart_') && key !== 'user_cart_guest') {
        const userId = getCurrentUserId();
        if (userId && key === `user_cart_${userId}`) {
            fetch(`http://127.0.0.1:5000/api/users/${userId}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart: JSON.parse(value) })
            }).catch(e => console.log("Lỗi đồng bộ giỏ hàng lên Server"));
        }
    }
};

// Biến lưu tạm danh sách tim để giao diện Load siêu tốc
let globalWishlist = [];

// Hàm lấy ID của User đang đăng nhập
function getCurrentUserId() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user._id || user.id; // Chấp cả ID của Google/Facebook hay MongoDB
}

// Hàm lấy Key Giỏ hàng tương ứng với User (hoặc khách)
function getCartKey() {
    return 'user_cart_' + (getCurrentUserId() || 'guest');
}

// Hàm tải tim từ SERVER về
async function fetchUserWishlist() {
    const userId = getCurrentUserId();
    if (!userId) {
        globalWishlist = [];
        updateWishlistCount();
        return;
    }
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/wishlist/${userId}`);
        const data = await res.json();
        globalWishlist = data; 
        updateWishlistCount(); 
    } catch (error) {
        console.error("Lỗi tải wishlist từ Server:", error);
    }
}

// Hàm cập nhật con số trên biểu tượng Yêu thích Header
function updateWishlistCount() {
    const wishlistBadge = document.querySelector('a[href="wishlist.html"] .cart-count');
    if (wishlistBadge) {
        wishlistBadge.textContent = globalWishlist.length;
    }
}

// Hàm cập nhật con số trên biểu tượng Giỏ hàng Header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    // Tính tổng số lượng sản phẩm trong giỏ hàng
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBtnWrap = document.querySelector('#cartBtn .icon-wrap');
    if (cartBtnWrap) {
        let badge = cartBtnWrap.querySelector('.cart-count');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-count';
            badge.style.right = '-8px'; // Dịch sang phải một chút cho đẹp
            cartBtnWrap.style.position = 'relative';
            cartBtnWrap.appendChild(badge);
        }
        
        if (totalQty > 0) {
            badge.textContent = totalQty > 99 ? '99+' : totalQty;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Hàm hiển thị Toast Message (Thông báo góc màn hình)
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    const iconClass = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Xóa thẻ html đi sau khi trượt ẩn
    }, 3000); // Tự động ẩn sau 3 giây
}

// Hàm xử lý chuyển trang chi tiết sản phẩm
function goToDetail(event, productId) {
    if (event.target.closest('.wishlist-btn')) return; 
    window.location.href = `product-detail.html?id=${productId}`;
}

// Hàm GỬI TIM LÊN SERVER
async function toggleWishlist(event, productId) {
    event.preventDefault(); 
    event.stopPropagation();

    const userId = getCurrentUserId();
    if (!userId) {
        showToast("Vui lòng đăng nhập để lưu truyện yêu thích nhé!", "error");
        window.location.href = "login.html";
        return;
    }

    // 1. Cập nhật giao diện lập tức (Cho mượt)
    const heartIcon = event.currentTarget.querySelector('i');
    const isLiked = heartIcon.classList.contains('fa-solid');
    const stringProductId = String(productId);
    
    if (isLiked) {
        heartIcon.classList.remove('fa-solid');
        heartIcon.classList.add('fa-regular');
        heartIcon.style.color = '#ccc';
        globalWishlist = globalWishlist.filter(id => id !== stringProductId);
    } else {
        heartIcon.classList.remove('fa-regular');
        heartIcon.classList.add('fa-solid');
        heartIcon.style.color = '#e74c3c';
        globalWishlist.push(stringProductId);
    }
    updateWishlistCount();

    // 2. Bắn API lưu ngầm vào Database
    try {
        const response = await fetch('http://127.0.0.1:5000/api/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId: stringProductId })
        });
        const data = await response.json();
        if (data.success) {
            globalWishlist = data.wishlist; // Ghi đè lại kết quả chuẩn xác từ Database
        }
    } catch (error) {
        console.error("Lỗi khi gửi tim lên server:", error);
    }
}


// ==========================================
// KHI TRANG ĐÃ TẢI XONG (DOM LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    
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
    const searchResults = document.getElementById('searchResults');
    const cartBtn = document.getElementById('cartBtn');
    const cartDropdown = document.getElementById('cartDropdown');
    const searchBtn = document.getElementById('searchBtn');
    
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
        if (!e.target.closest('.search-bar') && searchResults) {
            searchResults.classList.remove('show');
        }
        if (!e.target.closest('.header-left') && !e.target.closest('.icon-group')) {
            closeAllDropdowns();
        }
    });

    // 2. TẢI DANH MỤC
    async function loadCategories() {
        if (!categoryMenu) return;
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/categories`);
            const categories = await response.json();
            
            if (categories && categories.length > 0) {
                categoryMenu.innerHTML = categories.map(cat => 
                    `<li><a href="search.html?category=${cat.id}">${cat.name}</a></li>`
                ).join('');
            }
        } catch (error) {
            categoryMenu.innerHTML = '<li><a href="#">Lỗi kết nối Server</a></li>';
        }
    }

// ==========================================
// 4. XỬ LÝ TÌM KIẾM TOÀN SITE
// ==========================================


if (searchInput && searchBtn) {
    // Hàm xử lý điều hướng tìm kiếm
    const performSearch = () => {
        const keyword = searchInput.value.trim();
        if (keyword) {
            window.location.href = `search.html?q=${encodeURIComponent(keyword)}`;
        }
    };

    // Sự kiện Click nút tìm kiếm
    searchBtn.addEventListener('click', performSearch);

    // Sự kiện nhấn phím Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Logic gợi ý kết quả (Dropdown)
    if (searchResults) {
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
                    const data = await response.json();
                    const products = data.products || data; // Hỗ trợ định dạng có phân trang

                    if (products.length > 0) {
                        searchResults.innerHTML = products.map(item => {
                            let origPrice = item.price;
                            let fnPrice = origPrice;
                            if (item.discount && item.discount.includes('%')) {
                                let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                                if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
                            }
                            const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
                            const oldPriceHtml = fnPrice < origPrice ? `<span style="text-decoration: line-through; color: #bbb; font-size: 11px; margin-left: 5px;">${Number(origPrice).toLocaleString()}đ</span>` : '';
                            
                            return `
                            <div class="search-item" onclick="window.location.href='product-detail.html?id=${item.id}'">
                                <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='https://placehold.jp/200x250.png?text=No+Image';">
                                <div class="search-info">
                                    <h4>${item.productName || item.name}</h4>
                                    <p class="author" style="margin: 4px 0;">
                                        ${item.authorName ? 
                                            `<span style="color: #007bff; cursor: pointer; text-decoration: none; font-size: 12px;" onclick="event.stopPropagation(); window.location.href='search.html?q=${encodeURIComponent(item.authorName)}';" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                                <i class="fa-solid fa-pen-nib"></i> ${item.authorName}
                                            </span>` 
                                            : '<span style="color: #666; font-size: 12px;">Đang cập nhật</span>'
                                        }
                                    </p>
                                    <p class="price">${priceFormatted} ${oldPriceHtml}</p>
                                </div>
                            </div>
                            `;
                        }).join('') + `<div class="search-more"><a href="search.html?q=${encodeURIComponent(keyword)}">Xem tất cả kết quả</a></div>`;
                    } else {
                        searchResults.innerHTML = `<div class="search-empty">Không tìm thấy "${keyword}"</div>`;
                    }
                    searchResults.classList.add('show');
                } catch (err) {
                    console.error("Lỗi tìm kiếm gợi ý:", err);
                }
            }, 300);
        });
    }
}
    // 6. KIỂM TRA QUYỀN VÀ HIỂN THỊ MENU TÀI KHOẢN
    function checkLoginStatus() {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const accountList = document.querySelector('.account-list');
        
        const notiBtn = document.getElementById('notiBtn');
        const cartBtn = document.getElementById('cartBtn');
        const wishlistBtn = document.querySelector('.user-actions a[href="wishlist.html"]');
        
        const userStr = localStorage.getItem('currentUser');
        // THÊM MỚI: Lấy role đã lưu từ admin-login.js (kết quả của lõi C++)
        const userRole = localStorage.getItem('userRole'); 

        // Bổ sung lớp bảo vệ: Đảm bảo chuỗi an toàn mới tiến hành giải mã JSON
        let user = null;
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
            try { user = JSON.parse(userStr); } 
            catch (e) { localStorage.removeItem('currentUser'); }
        }

        if (user) {
            if (notiBtn) notiBtn.style.display = '';
            if (cartBtn) cartBtn.style.display = '';
            if (wishlistBtn) wishlistBtn.style.display = '';

            // XỬ LÝ CHỨC DANH HIỂN THỊ
            let roleName = "Khách hàng thành viên";
            if (userRole === 'admin') roleName = "Quản trị viên";
            if (userRole === 'staff') roleName = "Nhân viên hệ thống";

            const avatarUrl = user.picture || user.avatar || user.photo; 
            if (userNameDisplay) userNameDisplay.textContent = `Chào, ${user.fullName || user.userName || user.name || 'Thành viên'}`;
            
            // CẬP NHẬT: Thay vì hardcode, ta dùng biến roleName
            if (userRoleDisplay) userRoleDisplay.textContent = roleName;
            
            if (avatarUrl) {
                const accountIconWrap = document.querySelector('#accountBtn .icon-wrap');
                if (accountIconWrap) {
                    accountIconWrap.innerHTML = `<img src="${avatarUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; display: block;">`;
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
                            <span id="userRoleDisplay" style="font-size: 12px; color: #888; display: block; margin-top: 3px;">${roleName}</span>
                        </div>
                    `;
                }
            }

            if (accountList) {
                // THÊM MỚI: Kiểm tra nếu là Admin/Staff thì hiện thêm nút dẫn vào Dashboard
                let adminItem = "";
                if (userRole === 'admin' || userRole === 'staff') {
                    adminItem = `<a href="../admin/admin-dashboard.html" class="account-item" style="color: #e74c3c; font-weight: bold;"><i class="fa-solid fa-user-shield"></i> Trang Quản trị</a>`;
                }

                accountList.innerHTML = `
                    ${adminItem}
                    <a href="profile.html" class="account-item"><i class="fa-solid fa-address-card"></i> Hồ sơ của tôi</a>
                    <a href="orders.html" class="account-item"><i class="fa-solid fa-box-open"></i> Đơn hàng của tôi</a>
                    <a href="wishlist.html" class="account-item"><i class="fa-solid fa-heart"></i> Danh sách yêu thích</a>
                    <a href="#" class="account-item text-danger" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</a>
                `;

                document.getElementById('logoutBtn').addEventListener('click', function(e) {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    // THÊM MỚI: Xóa luôn role khi đăng xuất để bảo mật
                    localStorage.removeItem('userRole'); 
                    localStorage.removeItem('user_wishlist');
                    window.location.reload(); 
                });

                // TẢI GIỎ HÀNG TỪ SERVER XUỐNG KHI ĐĂNG NHẬP
                fetch(`http://127.0.0.1:5000/api/users/${user._id || user.id}/cart`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.cart) {
                            const cartKey = `user_cart_${user._id || user.id}`;
                            
                            // Luôn lấy dữ liệu mới nhất từ Server đè xuống máy tính hiện tại để đồng bộ đa thiết bị 100%
                            originalSetItem.call(localStorage, cartKey, JSON.stringify(data.cart));
                            updateCartCount();
                            if (typeof renderCart === 'function') renderCart();
                        }
                    });
            }
        } else {
            // ... Các phần hiển thị khi chưa đăng nhập giữ nguyên ...
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
    // 6. XỬ LÝ ĐĂNG KÝ NHẬN TIN (FOOTER)
    // ==========================================
    const subscribeBtn = document.getElementById('subscribeSubmitBtn');
    const subscribeInput = document.getElementById('subscribeEmailInput');
    if (subscribeBtn && subscribeInput) {
        subscribeBtn.addEventListener('click', async () => {
            const email = subscribeInput.value.trim();
            if (!email) {
                showToast("Vui lòng nhập địa chỉ email của bạn!", "error");
                return;
            }
            try {
                const res = await fetch('http://127.0.0.1:5000/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                showToast(data.message, data.success ? "success" : "error");
                if (data.success) subscribeInput.value = '';
            } catch (err) { showToast("Lỗi kết nối đến máy chủ!", "error"); }
        });
    }



    // ==========================================
    // 7. BIẾN THẺ SELECT THÀNH CUSTOM DROPDOWN TỰ ĐỘNG
    // ==========================================
    function initCustomSelects() {
        const selects = document.querySelectorAll('select.custom-select');
        selects.forEach(select => {
            if (select.parentElement.classList.contains('custom-select-wrapper')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select-wrapper';
            wrapper.style.flex = select.style.flex || '';
            wrapper.style.width = select.style.width || '100%';
            
            select.parentNode.insertBefore(wrapper, select);
            wrapper.appendChild(select);
            select.style.display = 'none'; // Ẩn select gốc đi

            const trigger = document.createElement('div');
            trigger.className = 'custom-select-trigger';
            
            const list = document.createElement('ul');
            list.className = 'custom-select-list';

            wrapper.appendChild(trigger);
            wrapper.appendChild(list);

            const renderList = () => {
                list.innerHTML = '';
                const options = Array.from(select.options);
                const selectedOption = options.find(o => o.selected) || options[0];
                const text = selectedOption ? selectedOption.textContent : 'Vui lòng chọn';
                trigger.innerHTML = `<span>${text}</span> <i class="fa-solid fa-chevron-down"></i>`;

                options.forEach((option, index) => {
                    const li = document.createElement('li');
                    li.className = 'custom-select-item';
                    if (option.selected) li.classList.add('selected');
                    li.textContent = option.textContent;
                    if (option.value === "") li.style.color = '#888';
                    
                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        select.selectedIndex = index;
                        select.dispatchEvent(new Event('change')); // Kích hoạt sự kiện đổi của select gốc
                        list.classList.remove('show');
                        trigger.classList.remove('active');
                    });
                    list.appendChild(li);
                });
            };

            renderList();

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom-select-list').forEach(el => { if (el !== list) el.classList.remove('show'); });
                document.querySelectorAll('.custom-select-trigger').forEach(el => { if (el !== trigger) el.classList.remove('active'); });
                list.classList.toggle('show');
                trigger.classList.toggle('active');
            });

            // Tự động vẽ lại danh sách nếu select gốc bị thay đổi bằng Javascript (Dùng cho Tỉnh/Huyện)
            const observer = new MutationObserver(() => renderList());
            observer.observe(select, { childList: true, subtree: true });

            // Cập nhật giao diện nếu giá trị select gốc thay đổi
            select.addEventListener('change', () => renderList());
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-list').forEach(el => el.classList.remove('show'));
            document.querySelectorAll('.custom-select-trigger').forEach(el => el.classList.remove('active'));
        });
    }

    // ==========================================
    // KHỞI CHẠY TẤT CẢ CÁC HÀM
    // ==========================================
    loadCategories();
    checkLoginStatus(); 
    fetchUserWishlist(); // Khôi phục gọi hàm này để cập nhật số lượng yêu thích
    updateCartCount();
    initCustomSelects();
});
