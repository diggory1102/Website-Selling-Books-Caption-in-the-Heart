let currentOrderData = null; // Biến lưu tạm dữ liệu để dùng cho nút Mua lại

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    // Hiển thị thông báo kết quả thanh toán từ VNPay nếu có
    const paymentStatus = urlParams.get('paymentStatus');
    if (paymentStatus === 'success') {
        if (typeof showToast === 'function') {
            showToast("💳 Thanh toán đơn hàng qua VNPAY thành công!", "success");
        } else {
            alert("💳 Thanh toán đơn hàng qua VNPAY thành công!");
        }

        // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng
        const clearCart = urlParams.get('clearCart');
        if (clearCart === 'true') {
            const latestCart = JSON.parse(localStorage.getItem(getCartKey())) || [];
            localStorage.setItem(getCartKey(), JSON.stringify(latestCart.filter(item => item.selected === false)));
            if (typeof updateCartCount === 'function') updateCartCount();
        }

        window.history.replaceState({}, document.title, window.location.pathname + `?id=${orderId}`);
    } else if (paymentStatus === 'failed') {
        if (typeof showToast === 'function') {
            showToast("❌ Thanh toán qua VNPAY thất bại hoặc đã bị hủy!", "error");
        } else {
            alert("❌ Thanh toán qua VNPAY thất bại hoặc đã bị hủy!");
        }
        window.history.replaceState({}, document.title, window.location.pathname + `?id=${orderId}`);
    }

    if (!orderId) {
        if (typeof showToast === 'function') showToast("Không tìm thấy mã đơn hàng!", "error");
        window.location.href = "orders.html";
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}`);
        const data = await response.json();

        if (data.success && data.order) {
            const order = data.order;
            currentOrderData = order; // Lưu vào biến toàn cục
            
            // Header
            document.getElementById('odCode').textContent = order.billCode || order._id.substring(0, 8).toUpperCase();
            document.getElementById('odStatus').textContent = order.status;
            document.getElementById('odDate').textContent = new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

            // Địa chỉ nhận hàng
            document.getElementById('odName').textContent = order.customerName || order.name || 'Không có';
            document.getElementById('odPhone').textContent = order.customerPhone || order.phone || 'Không có';
            document.getElementById('odAddress').textContent = order.shippingAddress || order.address || 'Không có';
            document.getElementById('odNote').textContent = order.note || 'Không có ghi chú';

            // Thanh toán
            let payMethod = "Chưa rõ";
            if (order.paymentId && order.paymentId.method) payMethod = order.paymentId.method;
            document.getElementById('odPaymentMethod').textContent = 
                payMethod === 'COD' ? 'Thanh toán tiền mặt (COD)' : 
                (payMethod === 'MOMO' ? 'Ví MoMo' : 
                (payMethod === 'VNPAY' ? 'Cổng thanh toán VNPAY' : 'Chuyển khoản Ngân hàng'));
            
            // Sản phẩm
            const itemsContainer = document.getElementById('odItems');
            itemsContainer.innerHTML = order.items.map(item => {
                const imgUrl = (item.productId && item.productId.imageUrl) ? item.productId.imageUrl : 'https://placehold.jp/100x140.png?text=No+Image';
                const itemTotal = item.priceAtPurchase * item.quantity;
                return `
                    <div class="od-item">
                        <a href="product-detail.html?id=${item.productId ? item.productId._id : ''}"><img src="${imgUrl}" alt="${item.productName}"></a>
                        <div class="od-item-info">
                            <a href="product-detail.html?id=${item.productId ? item.productId._id : ''}" style="text-decoration: none; color: inherit;">
                                <div class="od-item-name">${item.productName}</div>
                            </a>
                            <div class="od-item-meta">Số lượng: ${item.quantity}</div>
                            <div class="od-item-meta">Đơn giá: ${Number(item.priceAtPurchase).toLocaleString()}đ</div>
                        </div>
                        <div class="od-item-price">${Number(itemTotal).toLocaleString()}đ</div>
                    </div>
                `;
            }).join('');

            // Tóm tắt tiền
            document.getElementById('odSubTotal').textContent = Number(order.subTotal).toLocaleString() + 'đ';
            document.getElementById('odShippingFee').textContent = Number(order.shippingFee || 30000).toLocaleString() + 'đ';
            
            const discountRow = document.getElementById('odDiscountRow');
            if (order.discountValue > 0) {
                document.getElementById('odDiscount').textContent = '-' + Number(order.discountValue).toLocaleString() + 'đ';
                discountRow.style.display = 'flex';
            } else {
                discountRow.style.display = 'none';
            }

            document.getElementById('odTotal').textContent = Number(order.totalPrice).toLocaleString() + 'đ';

            // Cập nhật trạng thái nút
            const actionContainer = document.getElementById('odActions');
            actionContainer.style.display = 'flex'; // Đảm bảo hiển thị vùng chứa nút
            if (order.status === 'Đã nhận được hàng') {
                actionContainer.innerHTML = `
                    <button class="btn-action btn-reorder" style="background-color: #2ecc71; color: white;" onclick="window.location.href='review.html'">Đánh giá sản phẩm</button>
                    <button class="btn-action btn-reorder" onclick="reorder('${order._id}')">Mua lại đơn này</button>
                `;
            } else if (order.status === 'Đã giao') {
                actionContainer.innerHTML = `
                    <button class="btn-action btn-reorder" style="background-color: #3b82f6; color: white;" onclick="confirmReceived('${order._id}')">Đã nhận được hàng</button>
                    <button class="btn-action btn-reorder" onclick="reorder('${order._id}')">Mua lại đơn này</button>
                `;
            } else if (order.status === 'Đã hủy') {
                actionContainer.innerHTML = `<button class="btn-action btn-reorder" onclick="reorder('${order._id}')">Mua lại đơn này</button>`;
            } else if (order.status === 'Chờ xử lý' || order.status === 'Chờ thanh toán') {
                actionContainer.innerHTML = `<button class="btn-action btn-cancel" onclick="cancelOrder('${order._id}')">Hủy đơn hàng</button>`;
            } else {
                actionContainer.style.display = 'none';
            }

        } else {
            document.querySelector('.container').innerHTML = `<h2 style="margin-top: 50px; text-align: center;">Không tìm thấy đơn hàng!</h2>`;
        }
    } catch (err) {
        console.error(err);
        document.querySelector('.container').innerHTML = `<h2 style="margin-top: 50px; text-align: center;">Lỗi tải dữ liệu!</h2>`;
    }
});

window.reorder = function(orderId) {
    if (!currentOrderData || !currentOrderData.items) return;
    
    let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    
    // Bỏ chọn tất cả sản phẩm cũ đang có trong giỏ
    cart.forEach(item => item.selected = false);
    
    // Quét qua các truyện trong đơn hàng cũ và nhét lại vào giỏ
    currentOrderData.items.forEach(orderItem => {
        const productId = orderItem.productId ? (orderItem.productId._id || orderItem.productId.id) : null;
        if (!productId) return;
        
        let existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += orderItem.quantity;
            existingItem.selected = true; // Đánh dấu tích chọn để thanh toán luôn
        } else {
            cart.push({
                productId: productId,
                name: orderItem.productName,
                price: orderItem.priceAtPurchase, 
                imageUrl: (orderItem.productId && orderItem.productId.imageUrl) ? orderItem.productId.imageUrl : 'https://placehold.jp/100x140.png?text=No+Image',
                quantity: orderItem.quantity,
                maxStock: 100, 
                selected: true
            });
        }
    });
    
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    if (typeof updateCartCount === 'function') updateCartCount();
    if (typeof showToast === 'function') showToast("Đã thêm các sản phẩm vào giỏ hàng!", "success");
    
    // Chuyển hướng sang giỏ hàng để khách chốt lại đơn
    setTimeout(() => window.location.href = "cart.html", 1000);
};

window.cancelOrder = function(orderId) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'custom-confirm-overlay';
    
    const modalBox = document.createElement('div');
    modalBox.className = 'custom-confirm-box';
    modalBox.innerHTML = `
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation" style="color: #e74c3c;"></i></div>
        <h3>Xác nhận hủy đơn</h3>
        <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
        <div class="custom-confirm-actions">
            <button class="btn-cancel" id="btnCancelAction">Không</button>
            <button class="btn-confirm" id="btnConfirmAction">Đồng ý hủy</button>
        </div>
    `;
    
    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);
    
    document.getElementById('btnCancelAction').addEventListener('click', () => modalOverlay.remove());
    
    document.getElementById('btnConfirmAction').addEventListener('click', async () => {
        modalOverlay.remove();
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}/cancel`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                if (typeof showToast === 'function') showToast(data.message, "success");
                setTimeout(() => window.location.reload(), 1500); // Tải lại trang để cập nhật trạng thái
            } else {
                if (typeof showToast === 'function') showToast(data.message, "error");
            }
        } catch (err) {
            if (typeof showToast === 'function') showToast("Lỗi kết nối máy chủ!", "error");
        }
    });
};

window.confirmReceived = function(orderId) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'custom-confirm-overlay';
    
    const modalBox = document.createElement('div');
    modalBox.className = 'custom-confirm-box';
    modalBox.innerHTML = `
        <div class="confirm-icon"><i class="fa-solid fa-circle-check" style="color: #3b82f6;"></i></div>
        <h3>Xác nhận đã nhận hàng</h3>
        <p>Bạn đã nhận được đơn hàng này đầy đủ và không có khiếu nại gì?</p>
        <div class="custom-confirm-actions">
            <button class="btn-cancel" id="btnCancelAction">Không</button>
            <button class="btn-confirm" id="btnConfirmAction" style="background-color: #3b82f6; color: white;">Xác nhận</button>
        </div>
    `;
    
    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);
    
    document.getElementById('btnCancelAction').addEventListener('click', () => modalOverlay.remove());
    
    document.getElementById('btnConfirmAction').addEventListener('click', async () => {
        modalOverlay.remove();
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Đã nhận được hàng' })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof showToast === 'function') showToast("Xác nhận đã nhận hàng thành công!", "success");
                setTimeout(() => window.location.reload(), 1500); // Tải lại trang để cập nhật trạng thái
            } else {
                if (typeof showToast === 'function') showToast(data.message, "error");
            }
        } catch (err) {
            if (typeof showToast === 'function') showToast("Lỗi kết nối máy chủ!", "error");
        }
    });
};