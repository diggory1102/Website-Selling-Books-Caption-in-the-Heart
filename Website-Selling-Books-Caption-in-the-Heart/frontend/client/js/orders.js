document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra đăng nhập
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập để xem đơn hàng", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id || user._id;

    const ordersListContainer = document.getElementById('ordersList');
    const tabs = document.querySelectorAll('.tab-btn');
    let allOrders = [];

    // Lấy tham số trạng thái từ URL (VD: ?status=Đã giao)
    const urlParams = new URLSearchParams(window.location.search);
    const initialStatus = urlParams.get('status') || 'all';

    // Gọi API lấy đơn hàng
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/orders/user/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.orders;
            
            // Xử lý chuyển tab tự động theo URL
            tabs.forEach(t => t.classList.remove('active'));
            const targetTab = Array.from(tabs).find(t => t.getAttribute('data-status') === initialStatus) || document.querySelector('.tab-btn[data-status="all"]');
            if (targetTab) targetTab.classList.add('active');

            // Render danh sách tương ứng với trạng thái
            renderOrders(initialStatus === 'all' ? allOrders : allOrders.filter(o => o.status === initialStatus));
        } else {
            ordersListContainer.innerHTML = `<div style="text-align:center; padding: 50px; background:#fff; border-radius:12px;"><p>Lỗi tải đơn: ${data.message}</p></div>`;
        }
    } catch (err) {
        ordersListContainer.innerHTML = `<div style="text-align:center; padding: 50px; background:#fff; border-radius:12px;"><p>Lỗi kết nối máy chủ!</p></div>`;
    }

    // Hàm Render Đơn hàng ra HTML
    function renderOrders(ordersToRender) {
        if (ordersToRender.length === 0) {
            ordersListContainer.innerHTML = `
                <div style="text-align:center; padding: 50px; background:#fff; border-radius:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <i class="fa-solid fa-box-open" style="font-size: 60px; color: #ddd; margin-bottom: 15px; display: block;"></i>
                    <p style="color: #666; font-size: 15px;">Chưa có đơn hàng nào trong trạng thái này.</p>
                </div>
            `;
            return;
        }

        const html = ordersToRender.map(order => {
            const itemsHtml = order.items.map(item => {
                const imgUrl = (item.productId && item.productId.imageUrl) ? item.productId.imageUrl : 'https://placehold.jp/100x140.png?text=No+Image';
                return `
                <div class="order-item">
                    <img src="${imgUrl}" alt="${item.productName}">
                    <div class="order-item-info">
                        <div class="order-item-name">${item.productName}</div>
                        <div class="order-item-qty">Số lượng: ${item.quantity}</div>
                    </div>
                    <div class="order-item-price">${Number(item.priceAtPurchase).toLocaleString()}đ</div>
                </div>
                `;
            }).join('');

            const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <span class="order-code">Mã đơn: ${order.billCode || order._id.substring(0,8).toUpperCase()}</span>
                            <span style="font-size: 13px; color: #888; margin-left: 10px;">| ${dateStr}</span>
                        </div>
                        <div class="order-status">${order.status}</div>
                    </div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-footer">
                        <div class="order-total">Thành tiền: <span class="val">${Number(order.totalPrice).toLocaleString()}đ</span></div>
                        <button class="btn-detail" onclick="viewOrderDetail('${order._id}')">Xem chi tiết</button>
                    </div>
                </div>
            `;
        }).join('');

        ordersListContainer.innerHTML = html;
    }

    // Xử lý Sự kiện khi nhấn chuyển Tab
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const status = tab.getAttribute('data-status');
            renderOrders(status === 'all' ? allOrders : allOrders.filter(o => o.status === status));
        });
    });
});

// Nút xem chi tiết (Chuẩn bị cho tính năng Order Detail)
window.viewOrderDetail = function(orderId) {
    window.location.href = `order-detail.html?id=${orderId}`;
};