document.addEventListener('DOMContentLoaded', async () => {
    // 1. Lấy ID sản phẩm từ thanh URL (Ví dụ: product-detail.html?id=abc)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        if (typeof showToast === 'function') showToast("Không tìm thấy thông tin sản phẩm!", "error");
        window.location.href = "index.html";
        return;
    }

    try {
        // 2. Gọi API lấy dữ liệu chi tiết
        const response = await fetch(`http://127.0.0.1:5000/api/products/${productId}`);
        if (!response.ok) throw new Error("Sản phẩm không tồn tại");
        const product = await response.json();

        // 3. Đổ dữ liệu lên giao diện
        const bcCategory = document.getElementById('bcCategory');
        const actualCategoryName = product.categoryName || (product.categoryId && product.categoryId.name) || "Danh mục";
        const actualCategoryId = product.categoryId && product.categoryId._id ? product.categoryId._id : product.categoryId;
        
        bcCategory.textContent = actualCategoryName;
        if (actualCategoryId) bcCategory.href = `category.html?id=${actualCategoryId}`;
        
        document.getElementById('bcProductName').textContent = product.name;
        document.getElementById('pdName').textContent = product.name;
        
        const actualAuthorName = product.authorName || (product.authorId && product.authorId.name) || "Đang cập nhật";
        const actualPublisherName = product.publisherName || (product.publisherId && product.publisherId.name) || "Đang cập nhật";
        
        document.getElementById('pdAuthor').textContent = actualAuthorName;
        document.getElementById('pdPublisher').textContent = actualPublisherName;
        
        // Logic tính toán giá sau khi giảm (dựa trên %)
        let originalPrice = product.price;
        let finalPrice = originalPrice;

        if (product.discount) {
            const discEl = document.getElementById('pdDiscountTag');
            discEl.textContent = product.discount;
            discEl.style.display = 'block';

            if (product.discount.includes('%')) {
                let discountValue = parseFloat(product.discount.replace(/[^0-9.]/g, ''));
                if (!isNaN(discountValue)) {
                    finalPrice = originalPrice - (originalPrice * discountValue / 100);
                    
                    const oldPriceEl = document.getElementById('pdOldPrice');
                    oldPriceEl.textContent = Number(originalPrice).toLocaleString() + 'đ';
                    oldPriceEl.style.display = 'inline';
                }
            }
        }

        document.getElementById('pdPrice').textContent = Number(finalPrice).toLocaleString() + 'đ';
        document.getElementById('pdSold').textContent = product.sold || 0;
        document.getElementById('pdStock').textContent = `(Còn ${product.stock || 0} sản phẩm)`;
        document.getElementById('pdDesc').textContent = product.description || "Chưa có bài viết mô tả cho sản phẩm này.";
        
        const imgEl = document.getElementById('pdImage');
        imgEl.src = product.imageUrl || 'https://placehold.jp/350x450.png?text=No+Image';
        imgEl.onerror = () => { imgEl.src = 'https://placehold.jp/350x450.png?text=No+Image'; };

        // Render Số sao
        const rating = product.averageRating || 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
            else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
            else starsHtml += '<i class="fa-regular fa-star"></i>';
        }
        document.getElementById('pdRating').innerHTML = `${starsHtml} <span style="color: #888; font-size: 13px; margin-left: 8px;">(${product.totalReviews || 0} đánh giá)</span>`;

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
            let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
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
                existingItem.selected = false; // Không tự động chọn khi chỉ thêm vào giỏ
            } else {
                cart.push({
                    productId: productId,
                    name: product.name,
                    price: finalPrice, // Sử dụng giá đã giảm để lưu vào giỏ hàng
                    imageUrl: product.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
                    quantity: qty,
                    maxStock: maxStock,
                    selected: false // Không tự động chọn khi chỉ thêm vào giỏ
                });
            }

            localStorage.setItem(getCartKey(), JSON.stringify(cart));
            
            // Cập nhật lại số lượng trên Header ngay lập tức
            if (typeof updateCartCount === 'function') updateCartCount();
            
            if (typeof showToast === 'function') {
                showToast(`Đã thêm ${qty} cuốn vào giỏ hàng!`, "success");
            } else {
                alert(`Đã thêm ${qty} cuốn vào giỏ hàng!`);
            }
        });

        // Xử lý "Mua ngay" (Thêm vào giỏ và chuyển sang trang Thanh toán luôn)
        const btnBuyNow = document.getElementById('btnBuyNow');
        if (btnBuyNow) {
            btnBuyNow.addEventListener('click', () => {
                let cart = JSON.parse(localStorage.getItem(getCartKey())) || [];
                let qty = parseInt(qtyInput.value);

                // Bỏ chọn tất cả sản phẩm cũ trong giỏ hàng
                cart.forEach(item => item.selected = false);

                let existingItem = cart.find(item => item.productId === productId);
                if (existingItem) {
                    if (existingItem.quantity + qty > maxStock) {
                        if (typeof showToast === 'function') {
                            showToast("Số lượng mua vượt quá hàng tồn kho!", "error");
                        }
                        return;
                    }
                    existingItem.quantity += qty;
                    existingItem.selected = true; // Chỉ chọn duy nhất sản phẩm này
                } else {
                    cart.push({
                        productId: productId,
                        name: product.name,
                        price: finalPrice,
                        imageUrl: product.imageUrl || 'https://placehold.jp/200x280.png?text=No+Image',
                        quantity: qty,
                        maxStock: maxStock,
                        selected: true // Chỉ chọn duy nhất sản phẩm này
                    });
                }

                localStorage.setItem(getCartKey(), JSON.stringify(cart));
                
                // Chuyển hướng tới trang giỏ hàng (sản phẩm này đã được tự động tích chọn)
                window.location.href = 'cart.html';
            });
        }

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
                        let origPrice = item.price;
                        let fnPrice = origPrice;
                        if (item.discount && item.discount.includes('%')) {
                            let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                            if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
                        }

                        const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
                        const oldPriceHtml = fnPrice < origPrice ? `<span class="old">${Number(origPrice).toLocaleString()}đ</span>` : '';

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
                                            ${starsHtml} <span style="color: #888; font-size: 11px; margin-left: 5px;">(${item.totalReviews || 0})</span> <span class="sold-count" style="color: #757575; font-size: 11px; margin-left: 5px;">| Đã bán ${item.sold || 0}</span>
                                        </div>
                                        <div class="price-group">
                                            <span class="now">${priceFormatted}</span>
                                            ${oldPriceHtml}
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

        // 7. TẢI VÀ HIỂN THỊ DANH SÁCH KHÁCH HÀNG ĐÁNH GIÁ (CHE TÊN)
        try {
            const reviewsRes = await fetch(`http://127.0.0.1:5000/api/reviews/product/${productId}`);
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                if (reviewsData.success) {
                    const reviews = reviewsData.reviews;
                    
                    const reviewsSection = document.createElement('div');
                    reviewsSection.className = 'product-reviews-section';
                    reviewsSection.style.marginTop = '40px';
                    reviewsSection.style.marginBottom = '40px';
                    reviewsSection.style.padding = '20px 30px';
                    reviewsSection.style.background = '#fff';
                    reviewsSection.style.borderRadius = '12px';
                    reviewsSection.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';

                    let reviewsHtml = `<h3 style="margin-bottom: 20px; font-size: 18px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Đánh giá từ khách hàng đã mua (${reviews.length})</h3>`;

                    if (reviews.length === 0) {
                        reviewsHtml += `<p style="color: #666; font-size: 14px; text-align: center; padding: 20px 0;">Chưa có đánh giá nào cho sản phẩm này.</p>`;
                    } else {
                        reviewsHtml += `<div style="display: flex; flex-direction: column; gap: 20px;">`;
                        reviews.forEach(r => {
                            let rStars = '';
                            for (let i = 1; i <= 5; i++) {
                                rStars += `<i class="${i <= r.rating ? 'fa-solid' : 'fa-regular'} fa-star" style="color: #f1c40f; font-size: 13px;"></i>`;
                            }
                            
                            // Thuật toán bảo mật che tên khách hàng
                            let rawName = (r.userId && r.userId.fullName) ? r.userId.fullName : ((r.userId && r.userId.userName) ? r.userId.userName : 'Khách hàng');
                            let maskedName = rawName;
                            if (rawName.length > 2) maskedName = rawName.substring(0, 1) + '***' + rawName.substring(rawName.length - 1);
                            else if (rawName.length === 2) maskedName = rawName.substring(0, 1) + '*';

                            const rDate = new Date(r.createdAt).toLocaleDateString('vi-VN');
                            reviewsHtml += `
                                <div style="border-bottom: 1px dashed #eee; padding-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-weight: 600; font-size: 14px; color: #333;"><i class="fa-solid fa-circle-user" style="color:#ccc; margin-right:5px;"></i> ${maskedName}</span>
                                        <span style="font-size: 12px; color: #999;">${rDate}</span>
                                    </div>
                                    <div style="margin-bottom: 10px;">${rStars}</div>
                                    <p style="font-size: 14px; color: #555; line-height: 1.5; margin: 0;">${r.content || 'Người dùng không để lại nhận xét bằng chữ.'}</p>
                                </div>
                            `;
                        });
                        reviewsHtml += `</div>`;
                    }
                    reviewsSection.innerHTML = reviewsHtml;
                    document.querySelector('main.container') ? document.querySelector('main.container').appendChild(reviewsSection) : document.querySelector('.container').appendChild(reviewsSection);
                }
            }
        } catch (err) { console.error("Lỗi tải đánh giá:", err); }

    } catch (error) {
        console.error(error);
        document.querySelector('.pd-container').innerHTML = `<h3 style="color:red;">Lỗi tải dữ liệu. Sản phẩm không tồn tại!</h3>`;
    }
});