document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra giỏ hàng có rỗng không
    const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    if (cart.length === 0) {
        alert("Giỏ hàng trống! Vui lòng chọn truyện trước khi thanh toán.");
        window.location.href = "index.html";
        return;
    }

    // 2. Điền thông tin User (Nếu đã đăng nhập)
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('chkName').value = user.fullName || user.userName || '';
    }

    // 3. Render sản phẩm ra khung thanh toán
    const checkoutItems = document.getElementById('checkoutItems');
    let subTotal = 0;
    
    checkoutItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subTotal += itemTotal;
        return `
            <div class="checkout-item">
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${item.name}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span class="checkout-item-price">${Number(item.price).toLocaleString()}đ</span>
                        <span class="checkout-item-qty">Số lượng: ${item.quantity}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const shippingFee = 30000; // Mặc định phí ship là 30k
    let discountValue = 0;
    let appliedPromotionId = null;

    // Hàm tính lại tổng tiền
    function updateCheckoutTotal() {
        let total = subTotal + shippingFee - discountValue;
        if (total < 0) total = 0;
        
        document.getElementById('chkSubtotal').textContent = Number(subTotal).toLocaleString() + 'đ';
        document.getElementById('chkShipping').textContent = Number(shippingFee).toLocaleString() + 'đ';
        document.getElementById('chkTotal').textContent = Number(total).toLocaleString() + 'đ';
        
        const discountRow = document.getElementById('discountRow');
        if (discountValue > 0) {
            document.getElementById('chkDiscount').textContent = '-' + Number(discountValue).toLocaleString() + 'đ';
            discountRow.style.display = 'flex';
        } else {
            discountRow.style.display = 'none';
        }
        return total;
    }
    updateCheckoutTotal(); // Tính lần đầu

    // --- LOGIC DROPDOWN VOUCHER ---
    const voucherCodeInput = document.getElementById('voucherCode');
    const voucherDropdown = document.getElementById('voucherDropdown');
    let availableVouchers = [];

    // Tải danh sách voucher
    async function loadAvailableVouchers() {
        try {
            const res = await fetch('http://127.0.0.1:5000/api/promotions/available');
            const data = await res.json();
            if (data.success) availableVouchers = data.promotions;
        } catch (err) { console.error("Lỗi tải voucher:", err); }
    }
    loadAvailableVouchers(); // Gọi luôn khi vừa mở trang

    // Vẽ danh sách voucher ra dropdown
    function renderVoucherDropdown() {
        if (!voucherDropdown) return;
        if (availableVouchers.length === 0) {
            voucherDropdown.innerHTML = '<div class="voucher-empty">Hiện không có mã giảm giá nào</div>';
            return;
        }
        voucherDropdown.innerHTML = availableVouchers.map(v => {
            let desc = v.discountAmount > 0 ? `Giảm ${Number(v.discountAmount).toLocaleString()}đ` : `Giảm ${v.discountPercent}%`;
            let condition = v.minOrderValue > 0 ? `Đơn tối thiểu ${Number(v.minOrderValue).toLocaleString()}đ` : 'Áp dụng cho mọi đơn hàng';
            
            // Kiểm tra xem đơn hàng hiện tại có đủ điều kiện chưa
            const isEligible = subTotal >= v.minOrderValue;
            const opacity = isEligible ? '1' : '0.5';
            const warningHtml = !isEligible ? `<span style="color: #e74c3c; font-size: 11px; margin-top: 4px;">Chưa đủ điều kiện (Thiếu ${Number(v.minOrderValue - subTotal).toLocaleString()}đ)</span>` : '';

            return `
            <div class="voucher-item" onclick="selectVoucher('${v.code}', ${isEligible})" style="opacity: ${opacity}">
                <span class="v-code">${v.code}</span>
                <span class="v-desc">${desc} - ${condition}</span>
                ${warningHtml}
            </div>
            `;
        }).join('');
    }

    // Bắt sự kiện click vào ô nhập mã
    if (voucherCodeInput) {
        voucherCodeInput.addEventListener('focus', () => {
            renderVoucherDropdown();
            voucherDropdown.classList.add('show');
        });
    }

    // Ẩn menu khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (voucherDropdown && !e.target.closest('#voucherCode') && !e.target.closest('#voucherDropdown')) {
            voucherDropdown.classList.remove('show');
        }
    });

    // 4. Xử lý Áp dụng Voucher
    const btnApplyVoucher = document.getElementById('btnApplyVoucher');
    if (btnApplyVoucher) {
        btnApplyVoucher.addEventListener('click', async () => {
            const code = document.getElementById('voucherCode').value.trim();
            const voucherMessage = document.getElementById('voucherMessage');
            
            if (!code) {
                voucherMessage.textContent = "Vui lòng nhập mã giảm giá!";
                voucherMessage.style.color = "red";
                voucherMessage.style.display = "block";
                return;
            }

            try {
                const res = await fetch('http://127.0.0.1:5000/api/promotions/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, orderValue: subTotal })
                });
                const data = await res.json();

                if (data.success) {
                    const promo = data.promotion;
                    appliedPromotionId = promo._id || promo.id;
                    if (promo.discountAmount > 0) discountValue = promo.discountAmount;
                    else if (promo.discountPercent > 0) discountValue = (subTotal * promo.discountPercent) / 100;
                    if (discountValue > subTotal) discountValue = subTotal;

                    voucherMessage.textContent = "✅ Áp dụng mã giảm giá thành công!";
                    voucherMessage.style.color = "#27ae60";
                    voucherMessage.style.display = "block";
                    updateCheckoutTotal();
                } else {
                    voucherMessage.textContent = "❌ " + data.message;
                    voucherMessage.style.color = "red";
                    voucherMessage.style.display = "block";
                    discountValue = 0;
                    appliedPromotionId = null;
                    updateCheckoutTotal();
                }
            } catch (err) {
                console.error("Lỗi:", err);
            }
        });
    }

    // 5. Xử lý nút Đặt Hàng
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = document.querySelector('.btn-place-order');
        btnSubmit.textContent = "ĐANG XỬ LÝ...";
        btnSubmit.disabled = true;

        const orderData = {
            userId: userStr ? (JSON.parse(userStr).id || JSON.parse(userStr)._id) : null,
            items: cart,
            shippingInfo: {
                name: document.getElementById('chkName').value,
                phone: document.getElementById('chkPhone').value,
                address: document.getElementById('chkAddress').value,
                note: document.getElementById('chkNote').value
            },
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            subTotal: subTotal,
            shippingFee: shippingFee,
            discountValue: discountValue,
            promotionId: appliedPromotionId,
            totalPrice: updateCheckoutTotal()
        };

        try {
            const res = await fetch('http://127.0.0.1:5000/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem('user_cart'); // Xóa giỏ hàng khi đặt thành công
                if (typeof showToast === 'function') showToast("🎉 " + data.message, "success"); else alert(data.message);
                if (typeof updateCartCount === 'function') updateCartCount();
                setTimeout(() => window.location.href = "index.html", 2000);
            } else { alert(data.message); btnSubmit.textContent = "XÁC NHẬN ĐẶT HÀNG"; btnSubmit.disabled = false; }
        } catch (error) { alert("Lỗi kết nối máy chủ!"); btnSubmit.textContent = "XÁC NHẬN ĐẶT HÀNG"; btnSubmit.disabled = false; }
    });
});

// Hàm dùng chung để chọn voucher từ Dropdown
window.selectVoucher = function(code, isEligible) {
    if (!isEligible) {
        if (typeof showToast === 'function') showToast("Đơn hàng của bạn chưa đủ điều kiện để áp dụng mã này!", "error");
        return;
    }
    document.getElementById('voucherCode').value = code;
    document.getElementById('voucherDropdown').classList.remove('show');
    document.getElementById('btnApplyVoucher').click(); // Tự động click áp dụng luôn
}