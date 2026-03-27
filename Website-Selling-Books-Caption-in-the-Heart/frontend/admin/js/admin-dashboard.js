document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập (Bảo mật: Phải là admin hoặc staff)
    const userStr = localStorage.getItem('currentUser');
    const userRole = localStorage.getItem('userRole'); // Biến này lưu từ C++ truyền về

    if (!userStr || (userRole !== 'admin' && userRole !== 'staff')) {
        alert("Truy cập bị từ chối! Vui lòng đăng nhập bằng tài khoản Quản trị.");
        window.location.href = "admin-login.html";
        return;
    }

    const user = JSON.parse(userStr);
    document.getElementById('adminName').textContent = user.fullName || user.userName;
    document.getElementById('adminRole').textContent = userRole === 'admin' ? 'Quản trị viên (C++)' : 'Nhân viên';
    if (user.avatar) {
        document.getElementById('adminAvatar').src = user.avatar;
    }

    // 2. Logic Menu thả xuống của Avatar
    const profileBtn = document.getElementById('adminProfileBtn');
    const dropdown = document.getElementById('adminDropdown');
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));

    document.getElementById('btnLogout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        window.location.href = "admin-login.html";
    });

    // Nút điều hướng quay về trang Khách (Dành cho Admin muốn xem web)
    document.getElementById('btnGoToClient').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = "../client/index.html";
    });

    // 3. Gọi API lấy dữ liệu thống kê
    try {
        const resOrders = await fetch('http://127.0.0.1:5000/api/orders');
        const dataOrders = await resOrders.json();
        
        const resProducts = await fetch('http://127.0.0.1:5000/api/products');
        const products = await resProducts.json();

        // Tương thích với cả trường hợp Backend trả về mảng trực tiếp hoặc object { success: true, orders: [...] }
        const orders = Array.isArray(dataOrders) ? dataOrders : (dataOrders.orders || []);
        
        // Sắp xếp để đơn hàng mới nhất (vừa đặt) lên đầu
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        document.getElementById('statOrders').textContent = orders.length;

        // Tính tổng doanh thu (Chỉ tính đơn Đã giao)
        const totalRevenue = orders.filter(o => o.status === 'Đã giao').reduce((sum, o) => sum + o.totalPrice, 0);
        document.getElementById('statRevenue').textContent = Number(totalRevenue).toLocaleString() + 'đ';

        // Render 5 đơn hàng mới nhất vào bảng
        const recentOrders = orders.slice(0, 5); 
        const tbody = document.getElementById('recentOrdersTable');
        
        if (recentOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có đơn hàng nào</td></tr>`;
        } else {
            tbody.innerHTML = recentOrders.map(o => {
                const dateStr = new Date(o.createdAt).toLocaleDateString('vi-VN');
                let statusClass = 'status-pending';
                if (o.status === 'Đang giao') statusClass = 'status-delivering';
                if (o.status === 'Đã giao') statusClass = 'status-completed';
                if (o.status === 'Đã hủy') statusClass = 'status-cancelled';

                return `<tr> <td style="font-weight: 600;">${o.billCode || o._id.substring(0,8).toUpperCase()}</td> <td>${o.customerName}</td> <td>${dateStr}</td> <td style="font-weight: bold; color: var(--secondary);">${Number(o.totalPrice).toLocaleString()}đ</td> <td><span class="status-badge ${statusClass}">${o.status}</span></td> </tr>`;
            }).join('');
        }
        
        const productsArray = Array.isArray(products) ? products : (products.products || []);
        document.getElementById('statProducts').textContent = productsArray.length || 0;
    } catch (err) { console.error("Lỗi tải dữ liệu Dashboard:", err); }
});