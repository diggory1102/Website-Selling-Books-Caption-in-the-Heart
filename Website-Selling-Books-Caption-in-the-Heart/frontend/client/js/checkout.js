document.addEventListener('DOMContentLoaded', () => {
    // 1. Lọc chỉ lấy các sản phẩm đã được tích chọn trong giỏ hàng
    const allCart = JSON.parse(localStorage.getItem(getCartKey())) || [];
    const cart = allCart.filter(item => item.selected !== false);

    if (cart.length === 0) {
        if (typeof showToast === 'function') showToast("Chưa có sản phẩm nào được chọn để thanh toán!", "error");
        window.location.href = "cart.html";
        return;
    }

    // Khởi tạo danh sách ngày giao hàng dự kiến (5 ngày tới)
    const deliveryDateSelect = document.getElementById('chkDeliveryDate');
    if (deliveryDateSelect) {
        const today = new Date();
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        for (let i = 1; i <= 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i); // Tăng thêm i ngày
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            let option = document.createElement('option');
            option.value = `${days[d.getDay()]}, ${dateStr}`;
            option.textContent = `${days[d.getDay()]}, ${dateStr}`;
            deliveryDateSelect.appendChild(option);
        }
    }

    // Hàm gọi API lấy dữ liệu Tỉnh / Quận / Phường
async function loadProvinces(savedAddress = null) {
    try {
        // Đổi sang nguồn dữ liệu tĩnh từ Github (Cực kỳ ổn định, không bao giờ sập)
        const response = await fetch('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
        const provinces = await response.json();
        
        const citySelect = document.getElementById('chkCity');
        const districtSelect = document.getElementById('chkDistrict');
        const wardSelect = document.getElementById('chkWard');

        if (!citySelect || !districtSelect || !wardSelect) return;

        // 1. Đổ dữ liệu Tỉnh/Thành vào Dropdown đầu tiên
        provinces.forEach(city => {
            let option = document.createElement('option');
            option.value = city.Name;
            option.textContent = city.Name;
            citySelect.appendChild(option);
        });

        // 2. Bắt sự kiện khi người dùng chọn Tỉnh/Thành -> Load Quận/Huyện
        citySelect.addEventListener('change', function() {
            districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            
            const selectedCityName = this.value;
            if (!selectedCityName) return;

            const selectedCity = provinces.find(c => c.Name === selectedCityName);
            if (selectedCity && selectedCity.Districts) {
                selectedCity.Districts.forEach(district => {
                    let option = document.createElement('option');
                    option.value = district.Name;
                    option.textContent = district.Name;
                    districtSelect.appendChild(option);
                });
            }
        });

        // 3. Bắt sự kiện khi người dùng chọn Quận/Huyện -> Load Phường/Xã
        districtSelect.addEventListener('change', function() {
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            
            const selectedCityName = citySelect.value;
            const selectedDistrictName = this.value;
            if (!selectedCityName || !selectedDistrictName) return;

            const selectedCity = provinces.find(c => c.Name === selectedCityName);
            if (!selectedCity) return;
            
            const selectedDistrict = selectedCity.Districts.find(d => d.Name === selectedDistrictName);
            
            if (selectedDistrict && selectedDistrict.Wards && selectedDistrict.Wards.length > 0) {
                selectedDistrict.Wards.forEach(ward => {
                    let option = document.createElement('option');
                    option.value = ward.Name;
                    option.textContent = ward.Name;
                    wardSelect.appendChild(option);
                });
            } else {
                let option = document.createElement('option');
                option.value = "Không có Phường/Xã";
                option.textContent = "Không có Phường/Xã";
                wardSelect.appendChild(option);
            }
        });

        // --- TỰ ĐỘNG ĐIỀN TỪ SỔ ĐỊA CHỈ ĐÃ LƯU ---
        if (savedAddress && savedAddress.city) {
            citySelect.value = savedAddress.city;
            citySelect.dispatchEvent(new Event('change')); // Kích hoạt load Quận/Huyện

            if (savedAddress.district) {
                districtSelect.value = savedAddress.district;
                districtSelect.dispatchEvent(new Event('change')); // Kích hoạt load Phường/Xã

                if (savedAddress.ward) {
                    wardSelect.value = savedAddress.ward;
                }
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu địa giới hành chính:', error);
    }
}

    // Lấy thông tin user hiện tại để tạo khóa lưu Sổ địa chỉ riêng biệt
    const userStr = localStorage.getItem('currentUser');
    let currentUserId = 'guest';
    let userObj = null;
    if (userStr) {
        try { 
            userObj = JSON.parse(userStr); 
            currentUserId = userObj.id || userObj._id; 
        } catch(e) { console.error("Lỗi đọc thông tin user:", e); }
    }

    // Gọi hàm ngay khi vừa vào trang thanh toán (Lấy dữ liệu của riêng user này)
    const storageKey = `saved_shipping_address_${currentUserId}`;
    const savedAddressStr = localStorage.getItem(storageKey);
    const savedAddress = savedAddressStr ? JSON.parse(savedAddressStr) : null;
    loadProvinces(savedAddress);

    // 2. Điền thông tin User (Nếu đã đăng nhập) hoặc từ Sổ địa chỉ
    if (savedAddress) {
        document.getElementById('chkName').value = savedAddress.name || '';
        document.getElementById('chkPhone').value = savedAddress.phone || '';
        if (document.getElementById('chkAddressDetail')) {
            document.getElementById('chkAddressDetail').value = savedAddress.detail || '';
        }
    } else if (userObj) {
        document.getElementById('chkName').value = userObj.fullName || userObj.userName || '';
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

        const city = document.getElementById('chkCity') ? document.getElementById('chkCity').value : '';
        const district = document.getElementById('chkDistrict') ? document.getElementById('chkDistrict').value : '';
        const ward = document.getElementById('chkWard') ? document.getElementById('chkWard').value : '';
        const detail = document.getElementById('chkAddressDetail') ? document.getElementById('chkAddressDetail').value : '';
        const fullAddress = `${detail}, ${ward}, ${district}, ${city}`;

        // Lưu Sổ địa chỉ lại cho lần mua sau
        const addressToSave = {
            name: document.getElementById('chkName').value,
            phone: document.getElementById('chkPhone').value,
            city: city,
            district: district,
            ward: ward,
            detail: detail
        };
        localStorage.setItem(storageKey, JSON.stringify(addressToSave)); // Lưu vào khóa riêng của user

        const orderData = {
            userId: currentUserId === 'guest' ? null : currentUserId,
            items: cart,
            shippingInfo: {
                name: document.getElementById('chkName').value,
                phone: document.getElementById('chkPhone').value,
                address: fullAddress,
                note: document.getElementById('chkNote').value,
                expectedDeliveryDate: document.getElementById('chkDeliveryDate') ? document.getElementById('chkDeliveryDate').value : '',
                expectedDeliveryTime: document.getElementById('chkDeliveryTime') ? document.getElementById('chkDeliveryTime').value : ''
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
                // Chỉ giữ lại những sản phẩm chưa được chọn thanh toán
                const latestCart = JSON.parse(localStorage.getItem(getCartKey())) || [];
                localStorage.setItem(getCartKey(), JSON.stringify(latestCart.filter(item => item.selected === false)));
                if (typeof showToast === 'function') showToast("🎉 " + data.message, "success"); else alert(data.message);
                if (typeof updateCartCount === 'function') updateCartCount();
                setTimeout(() => window.location.href = "index.html", 2000);
            } else { 
                console.error("Chi tiết lỗi từ Backend:", data.message);
                if (typeof showToast === 'function') showToast(data.message, "error"); 
                btnSubmit.textContent = "XÁC NHẬN ĐẶT HÀNG"; 
                btnSubmit.disabled = false; 
            }
        } catch (error) { 
            if (typeof showToast === 'function') showToast("Lỗi kết nối máy chủ!", "error"); 
            btnSubmit.textContent = "XÁC NHẬN ĐẶT HÀNG"; 
            btnSubmit.disabled = false; 
        }
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