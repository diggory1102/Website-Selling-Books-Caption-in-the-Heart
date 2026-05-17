/**
 * Admin Layout Component Loader
 * Synchronizes Sidebar and Topbar across all admin pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    renderTopbar();
    setActiveMenu();
    setupTopbarLogic();
    setupSearchLogic();
});

function renderSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML = `
        <aside class="admin-sidebar">
            <div class="sidebar-brand">
                <img src="../client/images/logo.png" alt="Logo">
            </div>
            <ul class="sidebar-menu">
                <li><a href="admin-dashboard.html" data-page="dashboard"><i class="fa-solid fa-chart-line"></i> Tổng quan</a></li>
                <li><a href="orders.html" data-page="orders"><i class="fa-solid fa-cart-shopping"></i> Đơn hàng</a></li>
                <li><a href="products.html" data-page="products"><i class="fa-solid fa-book"></i> Sản phẩm</a></li>
                <li><a href="customers.html" data-page="customers"><i class="fa-solid fa-users"></i> Khách hàng</a></li>
                <li><a href="employees.html" data-page="employees"><i class="fa-solid fa-user-shield"></i> Nhân viên</a></li>
                <li><a href="promotions.html" data-page="promotions"><i class="fa-solid fa-ticket"></i> Khuyến mãi</a></li>
                <li><a href="reviews.html" data-page="reviews"><i class="fa-solid fa-star"></i> QL đánh giá</a></li>
                <li><a href="notifications.html" data-page="notifications"><i class="fa-solid fa-bell"></i> Quản lý Thông báo</a></li>
                <li><a href="campaigns.html" data-page="campaigns"><i class="fa-solid fa-paper-plane"></i> Chiến dịch Email</a></li>
                <li><a href="statistics.html" data-page="statistics"><i class="fa-solid fa-chart-simple"></i> Thống kê</a></li>
            </ul>
        </aside>
    `;
}

function renderTopbar() {
    const topbarContainer = document.getElementById('topbar-container');
    if (!topbarContainer) return;

    const pageTitle = topbarContainer.getAttribute('data-title') || 'Admin Panel';

    topbarContainer.innerHTML = `
        <header class="admin-topbar">
            <h2>${pageTitle}</h2>
            <div class="topbar-right">
                <div class="search-pill">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="global-search-input" placeholder="Tìm kiếm nhanh...">
                </div>
                <div class="icon-btn">
                    <i class="fa-solid fa-gear"></i>
                </div>
                <div class="icon-btn" style="position: relative;">
                    <i class="fa-regular fa-bell"></i>
                    <span class="notification-dot"></span>
                </div>
                
                <!-- Admin Profile with Dropdown -->
                <div class="admin-profile-wrapper">
                    <div class="admin-profile-trigger" id="adminProfileBtn" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                        <span id="adminNameTopbar" style="font-size: 13px; font-weight: 600; color: var(--text-main);">Admin</span>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="topbar-avatar" id="adminAvatar">
                    </div>
                    
                    <div class="admin-dropdown-menu" id="adminDropdown">
                        <a href="profile.html" class="dropdown-item">
                            <i class="fa-regular fa-circle-user"></i> Hồ sơ cá nhân
                        </a>
                        <div class="dropdown-item logout" id="btnLogoutAdmin">
                            <i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `;
}

function setActiveMenu() {
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function setupTopbarLogic() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        const avatarImg = document.getElementById('adminAvatar');
        const nameText = document.getElementById('adminNameTopbar');
        
        if (avatarImg && user.avatar) avatarImg.src = user.avatar;
        if (nameText) nameText.textContent = user.fullName || user.userName;
    }

    // Toggle Dropdown
    const profileBtn = document.getElementById('adminProfileBtn');
    const dropdown = document.getElementById('adminDropdown');
    
    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogoutAdmin');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Admin?")) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userRole');
                window.location.href = "admin-login.html";
            }
        });
    }
}

function setupSearchLogic() {
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (typeof window.handleSearch === 'function') {
                window.handleSearch(query);
            } else {
                console.warn("Trang này chưa hỗ trợ tìm kiếm!");
            }
        }
    });
}
