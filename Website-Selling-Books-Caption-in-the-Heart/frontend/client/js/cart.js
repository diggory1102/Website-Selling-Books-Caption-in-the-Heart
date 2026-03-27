document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartLeft = document.getElementById('cartLeft');
    const cartRight = document.getElementById('cartRight');
    
    let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    
    // Nếu giỏ hàng trống
    if (cart.length === 0) {
        cartLeft.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-cart-arrow-down"></i>
                <p>Giỏ hàng của bạn đang trống</p>
                <a href="index.html" class="btn-shopping">Tiếp tục mua sắm</a>
            </div>
        `;
        cartRight.style.display = 'none';
        return;
    }
    
    cartRight.style.display = 'block';
    
    let allSelected = cart.length > 0 && cart.every(item => item.selected !== false);

    let cartHtml = `<div class="cart-header" style="display: flex; align-items: center;">
        <label class="custom-checkbox-wrapper">
            <input type="checkbox" id="selectAll" ${allSelected ? 'checked' : ''} onchange="toggleSelectAll(this.checked)">
            <span class="custom-checkmark"></span>
        </label>
        <span style="flex: 1;">Tất cả Sản phẩm</span>
        <span style="width: 100px; text-align: right; padding-right: 35px;">Thành tiền</span>
    </div>`;
    
    let subTotal = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
        let isSelected = item.selected !== false; // Mặc định là chọn nếu chưa có trường selected
        const itemTotal = item.price * item.quantity;
        if (isSelected) {
            subTotal += itemTotal;
            totalItems += item.quantity;
        }

        cartHtml += `
            <div class="cart-item" style="position: relative; display: flex; align-items: center;">
                <label class="custom-checkbox-wrapper">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelect(${index}, this.checked)">
                    <span class="custom-checkmark"></span>
                </label>
                <a href="product-detail.html?id=${item.productId}"><img src="${item.imageUrl}" alt="${item.name}"></a>
                <div class="item-info">
                    <a href="product-detail.html?id=${item.productId}" class="item-name">${item.name}</a>
                    <div class="item-price">${Number(item.price).toLocaleString()}đ</div>
                </div>
                <div class="qty-box">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <input type="text" class="qty-input" value="${item.quantity}" readonly>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
                <div style="font-weight: bold; width: 100px; text-align: right; color: var(--secondary-color);">
                    ${Number(itemTotal).toLocaleString()}đ
                </div>
                <button class="btn-remove" onclick="removeItem(${index})" title="Xóa sản phẩm"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });

    cartLeft.innerHTML = cartHtml;
    document.getElementById('summaryCount').textContent = totalItems;
    document.getElementById('summarySubtotal').textContent = Number(subTotal).toLocaleString() + 'đ';
    document.getElementById('summaryTotal').textContent = Number(subTotal).toLocaleString() + 'đ';

    // Cập nhật trạng thái nút thanh toán (Chặn click nếu không có sản phẩm nào được chọn)
    const btnCheckout = document.querySelector('.btn-checkout') || document.querySelector('a[href="checkout.html"]');
    if (btnCheckout) {
        if (totalItems === 0) {
            btnCheckout.style.pointerEvents = 'none';
            btnCheckout.style.opacity = '0.5';
        } else {
            btnCheckout.style.pointerEvents = 'auto';
            btnCheckout.style.opacity = '1';
        }
    }
}

function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    if (cart[index]) {
        let newQty = cart[index].quantity + change;
        if (newQty > 0 && newQty <= (cart[index].maxStock || 100)) {
            cart[index].quantity = newQty;
            localStorage.setItem(getCartKey(), JSON.stringify(cart));
            renderCart();
            if (typeof updateCartCount === 'function') updateCartCount();
        } else if (newQty > (cart[index].maxStock || 100)) {
            if (typeof showToast === 'function') showToast("Số lượng vượt quá hàng tồn kho!", "error");
        }
    }
}

window.toggleSelect = function(index, isChecked) {
    let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    if (cart[index]) {
        cart[index].selected = isChecked;
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
        renderCart();
    }
}

window.toggleSelectAll = function(isChecked) {
    let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    cart.forEach(item => item.selected = isChecked);
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    renderCart();
}

function removeItem(index) {
    // 1. Tạo phần tử overlay (lớp nền đen mờ) cho popup
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'custom-confirm-overlay';
    
    // 2. Khung nội dung popup
    const modalBox = document.createElement('div');
    modalBox.className = 'custom-confirm-box';
    modalBox.innerHTML = `
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Xác nhận xóa</h3>
        <p>Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?</p>
        <div class="custom-confirm-actions">
            <button class="btn-cancel" id="btnCancelRemove">Hủy</button>
            <button class="btn-confirm" id="btnConfirmRemove">Đồng ý</button>
        </div>
    `;
    
    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);
    
    // 3. Xử lý sự kiện nút "Hủy" -> Đóng Popup
    document.getElementById('btnCancelRemove').addEventListener('click', () => {
        modalOverlay.remove();
    });
    
    // 4. Xử lý sự kiện nút "Đồng ý" -> Xóa sản phẩm và Đóng Popup
    document.getElementById('btnConfirmRemove').addEventListener('click', () => {
        let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
        cart.splice(index, 1);
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
        renderCart();
        if (typeof updateCartCount === 'function') updateCartCount();
        if (typeof showToast === 'function') showToast("Đã xóa sản phẩm khỏi giỏ hàng!", "success");
        modalOverlay.remove();
    });
}