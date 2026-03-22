document.addEventListener('DOMContentLoaded', async () => {
    // 1. Lấy ID sản phẩm từ thanh URL (Ví dụ: product-detail.html?id=abc)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert("Không tìm thấy thông tin sản phẩm!");
        window.location.href = "index.html";
        return;
    }

    try {
        // 2. Gọi API lấy dữ liệu chi tiết
        const response = await fetch(`http://127.0.0.1:5000/api/products/${productId}`);
        if (!response.ok) throw new Error("Sản phẩm không tồn tại");
        const product = await response.json();

        // 3. Đổ dữ liệu lên giao diện
        document.getElementById('bcCategory').textContent = product.categoryName || "Manga";
        document.getElementById('bcProductName').textContent = product.name;
        document.getElementById('pdName').textContent = product.name;
        document.getElementById('pdAuthor').textContent = product.authorName || "Đang cập nhật";
        document.getElementById('pdPublisher').textContent = product.publisherName || "NXB Kim Đồng";
        document.getElementById('pdPrice').textContent = Number(product.price).toLocaleString() + 'đ';
        document.getElementById('pdSold').textContent = product.sold || 0;
        document.getElementById('pdStock').textContent = `(Còn ${product.stock || 0} sản phẩm)`;
        document.getElementById('pdDesc').textContent = product.description || "Chưa có bài viết mô tả cho sản phẩm này.";
        
        const imgEl = document.getElementById('pdImage');
        imgEl.src = product.imageUrl || 'https://placehold.jp/350x450.png?text=No+Image';
        imgEl.onerror = () => { imgEl.src = 'https://placehold.jp/350x450.png?text=No+Image'; };

        if (product.discount) {
            const discEl = document.getElementById('pdDiscountTag');
            discEl.textContent = product.discount;
            discEl.style.display = 'block';
        }

        // Render Số sao
        const rating = product.averageRating || 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
            else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
            else starsHtml += '<i class="fa-regular fa-star"></i>';
        }
        document.getElementById('pdRating').innerHTML = starsHtml;

        // 4. Logic Tăng / Giảm số lượng
        const qtyInput = document.getElementById('pdQuantity');
        let maxStock = product.stock || 100; // Cho mua tối đa nếu chưa nhập DB

        document.getElementById('btnPlus').addEventListener('click', () => {
            let current = parseInt(qtyInput.value);
            if (current < maxStock) qtyInput.value = current + 1;
        });

        document.getElementById('btnMinus').addEventListener('click', () => {
            let current = parseInt(qtyInput.value);
            if (current > 1) qtyInput.value = current - 1;
        });

        // 5. Xử lý "Thêm vào giỏ hàng" (Lưu tạm LocalStorage để làm Ưu tiên 2)
        document.getElementById('btnAddToCart').addEventListener('click', () => {
            let cart = JSON.parse(localStorage.getItem('user_cart')) || [];
            let qty = parseInt(qtyInput.value);

            let existingItem = cart.find(item => item.productId === productId);
            if (existingItem) {
                if (existingItem.quantity + qty > maxStock) {
                    if (typeof showToast === 'function') {
                        showToast("Số lượng mua vượt quá hàng tồn kho!", "error");
                    } else {
                        alert("Số lượng mua vượt quá hàng tồn kho!");
                    }
                    return;
                }
                existingItem.quantity += qty;
            } else {
                cart.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
                    quantity: qty,
                    maxStock: maxStock
                });
            }

            localStorage.setItem('user_cart', JSON.stringify(cart));
            
            // Cập nhật lại số lượng trên Header ngay lập tức
            if (typeof updateCartCount === 'function') updateCartCount();
            
            if (typeof showToast === 'function') {
                showToast(`Đã thêm ${qty} cuốn vào giỏ hàng!`, "success");
            } else {
                alert(`Đã thêm ${qty} cuốn vào giỏ hàng!`);
            }
        });

        // 6. Tải truyện cùng tác giả và cùng thể loại
        try {
            const relatedRes = await fetch(`http://127.0.0.1:5000/api/products/${productId}/related`);
            if (relatedRes.ok) {
                const relatedData = await relatedRes.json();
                
                const renderCards = (products, containerId, sectionId) => {
                    // Nếu không có truyện nào liên quan thì không hiện nguyên khối đó lên
                    if (!products || products.length === 0) return;
                    document.getElementById(sectionId).style.display = 'block';
                    
                    const html = products.map(item => {
                        const priceFormatted = Number(item.price).toLocaleString() + 'đ';
                        const rating = item.averageRating || 0;
                        let starsHtml = '';
                        for (let i = 1; i <= 5; i++) {
                            if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                            else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                            else starsHtml += '<i class="fa-regular fa-star"></i>';
                        }
                        
                        return `
                            <div class="product-card">
                                <a href="product-detail.html?id=${item._id || item.id}" style="text-decoration: none; color: inherit;">
                                    <div class="img-box">
                                        ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                                        <img src="${item.imageUrl}" onerror="this.src='https://placehold.jp/200x250.png?text=No+Image'">
                                    </div>
                                    <div class="info-box">
                                        <h3 class="name">${item.name}</h3>
                                        <div class="author" style="font-size: 13px; margin-bottom: 8px;">
                                            ${item.authorName ? 
                                                `<span style="color: #007bff; cursor: pointer; text-decoration: none;" onclick="event.preventDefault(); window.location.href='search.html?q=${encodeURIComponent(item.authorName)}';" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                                    <i class="fa-solid fa-pen-nib"></i> ${item.authorName}
                                                </span>` 
                                                : '<span style="color: #666;">Đang cập nhật</span>'
                                            }
                                        </div>
                                        <div class="stars">
                                            ${starsHtml} <span class="sold-count" style="color: #757575; font-size: 11px; margin-left: 5px;">| Đã bán ${item.sold || 0}</span>
                                        </div>
                                        <div class="price-group">
                                            <span class="now">${priceFormatted}</span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        `;
                    }).join('');
                    document.getElementById(containerId).innerHTML = html;
                };

                renderCards(relatedData.sameAuthor, 'relatedAuthorGrid', 'relatedAuthorSection');
                renderCards(relatedData.sameCategory, 'relatedCategoryGrid', 'relatedCategorySection');
            }
        } catch (err) {
            console.error("Lỗi tải truyện liên quan:", err);
        }

    } catch (error) {
        console.error(error);
        document.querySelector('.pd-container').innerHTML = `<h3 style="color:red;">Lỗi tải dữ liệu. Sản phẩm không tồn tại!</h3>`;
    }
});