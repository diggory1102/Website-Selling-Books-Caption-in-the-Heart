document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartLeft = document.getElementById('cartLeft');
    const cartRight = document.getElementById('cartRight');
    
    let cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    
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
    
    let cartHtml = `<div class="cart-header"><span>Sản phẩm</span><span style="width: 100px; text-align: right; padding-right: 35px;">Thành tiền</span></div>`;
    let subTotal = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subTotal += itemTotal;
        totalItems += item.quantity;

        cartHtml += `
            <div class="cart-item">
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
}

function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    if (cart[index]) {
        let newQty = cart[index].quantity + change;
        if (newQty > 0 && newQty <= (cart[index].maxStock || 100)) {
            cart[index].quantity = newQty;
            localStorage.setItem('user_cart', JSON.stringify(cart));
            renderCart();
            if (typeof updateCartCount === 'function') updateCartCount();
        } else if (newQty > (cart[index].maxStock || 100)) {
            if (typeof showToast === 'function') showToast("Số lượng vượt quá hàng tồn kho!", "error");
        }
    }
}

function removeItem(index) {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        let cart = JSON.parse(localStorage.getItem('user_cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('user_cart', JSON.stringify(cart));
        renderCart();
        if (typeof updateCartCount === 'function') updateCartCount();
        if (typeof showToast === 'function') showToast("Đã xóa sản phẩm khỏi giỏ hàng!", "success");
    }
}