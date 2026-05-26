/**
 * Admin Layout Component Loader
 * Synchronizes Sidebar and Topbar across all admin pages.
 */

// Inject Settings CSS Styles
const settingsStyle = document.createElement('style');
settingsStyle.textContent = `
    .admin-settings-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    .admin-settings-modal.show {
        display: flex;
    }
    .admin-settings-box {
        background: #fff;
        width: 500px;
        max-width: 90%;
        border-radius: 15px;
        padding: 25px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        position: relative;
        font-family: 'Montserrat', sans-serif;
    }
    .admin-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }
    .admin-settings-close {
        cursor: pointer;
        font-size: 20px;
        color: #888;
        transition: 0.2s;
    }
    .admin-settings-close:hover {
        color: #000;
    }
    .admin-settings-form-group {
        margin-bottom: 15px;
        text-align: left;
    }
    .admin-settings-form-group label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 5px;
        color: #333;
    }
    .admin-settings-form-group input[type="text"],
    .admin-settings-form-group input[type="email"],
    .admin-settings-form-group input[type="password"] {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        box-sizing: border-box;
    }
    .admin-settings-form-group input:focus {
        border-color: #3b82f6;
    }
    .admin-settings-tabs {
        display: flex;
        gap: 15px;
        border-bottom: 1px solid #eee;
        margin-bottom: 15px;
    }
    .admin-settings-tab {
        padding: 8px 0;
        font-size: 13px;
        font-weight: 600;
        color: #888;
        cursor: pointer;
        border-bottom: 2px solid transparent;
    }
    .admin-settings-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }
    .admin-settings-btn {
        background: #3b82f6;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 10px;
        transition: 0.2s;
    }
    .admin-settings-btn:hover {
        opacity: 0.9;
    }
`;
document.head.appendChild(settingsStyle);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra phân quyền truy cập Admin (Gatekeeper)
    const currentPath = window.location.pathname;
    if (!currentPath.includes('admin-login.html')) {
        const adminUserStr = localStorage.getItem('adminUser');
        const adminRoleVal = localStorage.getItem('adminRole');

        if (!adminUserStr || (adminRoleVal !== 'admin' && adminRoleVal !== 'staff')) {
            alert("Truy cập bị từ chối! Vui lòng đăng nhập bằng tài khoản Quản trị.");
            window.location.href = "admin-login.html";
            return;
        }
    }

    renderSidebar();
    renderTopbar();
    renderSettingsModal();
    setActiveMenu();
    setupTopbarLogic();
    setupSearchLogic();
    setupSettingsModalLogic();
    loadAdminNotifications();
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
                <li><a href="reviews.html" data-page="reviews"><i class="fa-solid fa-star"></i> Quản lý đánh giá</a></li>
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
                <div class="icon-btn" id="adminSettingsBtn" style="cursor: pointer;" title="Cài đặt tài khoản">
                    <i class="fa-solid fa-gear"></i>
                </div>
                <div class="icon-btn" style="position: relative;" id="adminNotificationBtn" title="Thông báo hệ thống">
                    <i class="fa-regular fa-bell"></i>
                    <span class="notification-dot" id="adminNotiDot" style="display: none;"></span>
                    
                    <div class="admin-dropdown-menu noti-dropdown" id="adminNotiDropdown" style="width: 320px; right: 0; padding: 10px 0; display: none; position: absolute; top: 100%; background: #fff; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); z-index: 1000; text-align: left;">
                        <div style="padding: 10px 15px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 14px; display: flex; justify-content: space-between; align-items: center; font-family: 'Montserrat', sans-serif;">
                            <span>Thông báo mới</span>
                            <span id="adminNotiCount" style="background: #ef4444; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 10px;">0</span>
                        </div>
                        <div id="adminNotiList" style="max-height: 250px; overflow-y: auto; font-size: 13px; font-family: 'Montserrat', sans-serif;">
                            <div style="padding: 20px; text-align: center; color: #888;">Không có thông báo mới</div>
                        </div>
                        <a href="notifications.html" style="display: block; text-align: center; padding: 10px; border-top: 1px solid #eee; font-size: 12px; color: #3b82f6; font-weight: 600; text-decoration: none; font-family: 'Montserrat', sans-serif;">Xem tất cả thông báo</a>
                    </div>
                </div>
                
                <!-- Admin Profile with Dropdown -->
                <div class="admin-profile-wrapper">
                    <div class="admin-profile-trigger" id="adminProfileBtn" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                        <span id="adminNameTopbar" style="font-size: 13px; font-weight: 600; color: var(--text-main);">Admin</span>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="topbar-avatar" id="adminAvatar">
                    </div>
                    
                    <div class="admin-dropdown-menu" id="adminDropdown">
                        <a href="#" class="dropdown-item" id="btnAdminProfileMenu">
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

function renderSettingsModal() {
    if (document.getElementById('adminSettingsModal')) return;
    const modal = document.createElement('div');
    modal.className = 'admin-settings-modal';
    modal.id = 'adminSettingsModal';
    modal.innerHTML = `
        <div class="admin-settings-box">
            <div class="admin-settings-header">
                <h3 style="margin: 0; font-size: 18px;">Cấu hình Tài khoản</h3>
                <i class="fa-solid fa-xmark admin-settings-close" id="closeSettingsModal"></i>
            </div>
            
            <div class="admin-settings-tabs">
                <div class="admin-settings-tab active" id="tabSetProfile" onclick="switchSettingsTab('profile')">Hồ sơ cá nhân</div>
                <div class="admin-settings-tab" id="tabSetPassword" onclick="switchSettingsTab('password')">Đổi mật khẩu</div>
            </div>
            
            <!-- FORM PROFILE -->
            <form id="adminProfileForm">
                <div class="admin-settings-form-group">
                    <label>Họ và tên</label>
                    <input type="text" id="setFullName" placeholder="Nhập họ tên..." required>
                </div>
                <div class="admin-settings-form-group">
                    <label>Số điện thoại (bắt buộc)</label>
                    <input type="text" id="setPhone" placeholder="Nhập số điện thoại..." required>
                </div>
                <div class="admin-settings-form-group">
                    <label>Email</label>
                    <input type="email" id="setEmail" placeholder="Nhập email...">
                </div>
                <div class="admin-settings-form-group">
                    <label>Ảnh đại diện</label>
                    <div style="display: flex; gap: 15px; align-items: center; margin-top: 5px;">
                        <img src="" id="setAvatarPreview" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; background: #eee;">
                        <input type="file" id="setAvatarFile" accept="image/*" style="flex: 1; font-family: inherit; font-size: 13px;">
                    </div>
                </div>
                <button type="submit" class="admin-settings-btn">Lưu thông tin</button>
            </form>
            
            <!-- FORM PASSWORD -->
            <form id="adminPasswordForm" style="display: none;">
                <div class="admin-settings-form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input type="password" id="setCurrentPassword" placeholder="Nhập mật khẩu hiện tại...">
                </div>
                <div class="admin-settings-form-group">
                    <label>Mật khẩu mới</label>
                    <input type="password" id="setNewPassword" placeholder="Nhập mật khẩu mới...">
                </div>
                <div class="admin-settings-form-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <input type="password" id="setConfirmPassword" placeholder="Nhập lại mật khẩu mới...">
                </div>
                <button type="submit" class="admin-settings-btn" style="background: #e74c3c;">Đổi mật khẩu</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

window.switchSettingsTab = function (tab) {
    const profileForm = document.getElementById('adminProfileForm');
    const passwordForm = document.getElementById('adminPasswordForm');
    const tabProfile = document.getElementById('tabSetProfile');
    const tabPassword = document.getElementById('tabSetPassword');

    if (tab === 'profile') {
        profileForm.style.display = 'block';
        passwordForm.style.display = 'none';
        tabProfile.classList.add('active');
        tabPassword.classList.remove('active');
    } else {
        profileForm.style.display = 'none';
        passwordForm.style.display = 'block';
        tabProfile.classList.remove('active');
        tabPassword.classList.add('active');
    }
};

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
    const userStr = localStorage.getItem('adminUser');
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
    const notiDropdown = document.getElementById('adminNotiDropdown');

    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notiDropdown) notiDropdown.style.display = 'none';
            dropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }

    // Toggle Notifications Dropdown
    const notiBtn = document.getElementById('adminNotificationBtn');
    if (notiBtn && notiDropdown) {
        notiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.remove('show');
            const isOpen = notiDropdown.style.display === 'block';
            notiDropdown.style.display = isOpen ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            if (notiDropdown) notiDropdown.style.display = 'none';
        });

        notiDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogoutAdmin');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Admin?")) {
                localStorage.removeItem('adminUser');
                localStorage.removeItem('adminRole');
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

function setupSettingsModalLogic() {
    const gearBtn = document.getElementById('adminSettingsBtn');
    const profileItemMenu = document.getElementById('btnAdminProfileMenu');
    const settingsModal = document.getElementById('adminSettingsModal');
    const closeBtn = document.getElementById('closeSettingsModal');
    const fileInput = document.getElementById('setAvatarFile');
    const previewImg = document.getElementById('setAvatarPreview');
    let uploadedAvatarUrl = '';

    const openModal = () => {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            document.getElementById('setFullName').value = user.fullName || '';
            document.getElementById('setPhone').value = user.numberPhone || '';
            document.getElementById('setEmail').value = user.email || '';

            if (previewImg) {
                previewImg.src = user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
                previewImg.style.display = 'block';
            }
            uploadedAvatarUrl = user.avatar || '';
        }
        window.switchSettingsTab('profile');
        if (settingsModal) settingsModal.classList.add('show');
    };

    if (gearBtn) gearBtn.addEventListener('click', openModal);
    if (profileItemMenu) {
        profileItemMenu.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (closeBtn && settingsModal) {
        closeBtn.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });
    }

    // File change handler
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            try {
                if (previewImg) {
                    previewImg.style.opacity = '0.5';
                }
                const res = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    uploadedAvatarUrl = data.imageUrl;
                    if (previewImg) {
                        previewImg.src = data.imageUrl;
                        previewImg.style.opacity = '1';
                    }
                } else {
                    alert("Tải ảnh lên thất bại!");
                    if (previewImg) previewImg.style.opacity = '1';
                }
            } catch (err) {
                alert("Lỗi kết nối khi tải ảnh!");
                if (previewImg) previewImg.style.opacity = '1';
            }
        });
    }

    // Form submit handlers
    const profileForm = document.getElementById('adminProfileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userStr = localStorage.getItem('adminUser');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            const userId = user.id || user._id;

            const fullName = document.getElementById('setFullName').value.trim();
            const numberPhone = document.getElementById('setPhone').value.trim();
            const email = document.getElementById('setEmail').value.trim();
            const avatar = uploadedAvatarUrl;

            try {
                const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, numberPhone, email, avatar })
                });
                const data = await res.json();
                if (data.success) {
                    // Update localStorage
                    localStorage.setItem('adminUser', JSON.stringify(data.user));

                    // Update layout UI
                    const avatarImg = document.getElementById('adminAvatar');
                    const nameText = document.getElementById('adminNameTopbar');
                    if (avatarImg && data.user.avatar) avatarImg.src = data.user.avatar;
                    if (nameText) nameText.textContent = data.user.fullName || data.user.userName;

                    alert("Cập nhật thông tin thành công!");
                    settingsModal.classList.remove('show');
                } else {
                    alert("Cập nhật thất bại: " + data.message);
                }
            } catch (err) {
                alert("Lỗi kết nối máy chủ!");
            }
        });
    }

    const passwordForm = document.getElementById('adminPasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userStr = localStorage.getItem('adminUser');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            const userId = user.id || user._id;

            const currentPassword = document.getElementById('setCurrentPassword').value;
            const newPassword = document.getElementById('setNewPassword').value;
            const confirmPassword = document.getElementById('setConfirmPassword').value;

            if (newPassword !== confirmPassword) {
                alert("Mật khẩu mới không trùng khớp!");
                return;
            }

            try {
                const res = await fetch(`http://localhost:5000/api/users/${userId}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();
                if (data.success) {
                    alert("Đổi mật khẩu thành công!");
                    passwordForm.reset();
                    settingsModal.classList.remove('show');
                } else {
                    alert("Lỗi đổi mật khẩu: " + data.message);
                }
            } catch (err) {
                alert("Lỗi kết nối máy chủ!");
            }
        });
    }
}

async function loadAdminNotifications() {
    try {
        const res = await fetch('http://localhost:5000/api/notifications/admin/all');
        const data = await res.json();
        if (data.success && data.notifications) {
            const notifications = data.notifications;
            const notiCountEl = document.getElementById('adminNotiCount');
            const notiDot = document.getElementById('adminNotiDot');
            const notiListEl = document.getElementById('adminNotiList');

            if (!notiListEl) return;

            const unreadNotis = notifications.filter(n => !n.isRead);
            if (notiCountEl) notiCountEl.textContent = unreadNotis.length;
            if (notiDot) notiDot.style.display = unreadNotis.length > 0 ? 'block' : 'none';

            if (notifications.length === 0) {
                notiListEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Không có thông báo mới</div>';
            } else {
                notiListEl.innerHTML = notifications.slice(0, 5).map(n => {
                    const dateStr = new Date(n.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const bg = n.isRead ? '#fff' : '#f0f9ff';
                    return `
                        <div style="padding: 10px 15px; border-bottom: 1px solid #f3f4f6; background: ${bg}; cursor: pointer;" onclick="markAdminNotiAsRead('${n._id}')">
                            <div style="font-weight: 600; color: #333; margin-bottom: 3px;">${n.title}</div>
                            <div style="color: #666; font-size: 11px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${n.content}</div>
                            <div style="color: #999; font-size: 10px; margin-top: 5px; text-align: right;">${dateStr}</div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error("Lỗi tải thông báo admin:", err);
    }
}

window.markAdminNotiAsRead = async function (notiId) {
    try {
        await fetch(`http://localhost:5000/api/notifications/${notiId}/read`, { method: 'PUT' });
        loadAdminNotifications();
    } catch (err) {
        console.error("Lỗi đọc thông báo:", err);
    }
};
