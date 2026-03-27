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
    const menuChkDeliveryDate = document.getElementById('menuChkDeliveryDate');
    const textChkDeliveryDate = document.getElementById('textChkDeliveryDate');
    const inputChkDeliveryDate = document.getElementById('chkDeliveryDate');

    if (menuChkDeliveryDate) {
        const today = new Date();
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        let html = '';
        for (let i = 1; i <= 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i); // Tăng thêm i ngày
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            const value = `${days[d.getDay()]}, ${dateStr}`;
            html += `<li><a href="#" data-value="${value}">${value}</a></li>`;
            
            // Gán ngày đầu tiên làm mặc định
            if (i === 1) {
                textChkDeliveryDate.textContent = value;
                inputChkDeliveryDate.value = value;
            }
        }
        menuChkDeliveryDate.innerHTML = html;
    }

    // DOM cho địa chỉ
    const inputCity = document.getElementById('chkCity');
    const inputDistrict = document.getElementById('chkDistrict');
    const inputWard = document.getElementById('chkWard');

    const textCity = document.getElementById('textChkCity');
    const textDistrict = document.getElementById('textChkDistrict');
    const textWard = document.getElementById('textChkWard');

    const menuCity = document.getElementById('menuChkCity');
    const menuDistrict = document.getElementById('menuChkDistrict');
    const menuWard = document.getElementById('menuChkWard');

    // Hàm gọi API lấy dữ liệu Tỉnh / Quận / Phường
async function loadProvinces(savedAddress = null) {
    try {
        // Đổi sang nguồn dữ liệu tĩnh từ Github (Cực kỳ ổn định, không bao giờ sập)
        const response = await fetch('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
        const provinces = await response.json();
        
        if (!menuCity || !menuDistrict || !menuWard) return;

        // 1. Đổ dữ liệu Tỉnh/Thành vào Dropdown đầu tiên
        let cityHtml = '<li><a href="#" data-value="">Chọn Tỉnh/Thành phố</a></li>';
        provinces.forEach(city => {
            cityHtml += `<li><a href="#" data-value="${city.Name}">${city.Name}</a></li>`;
        });
        menuCity.innerHTML = cityHtml;

        // Hàm xử lý chọn Tỉnh
        window.handleCitySelect = function(cityName) {
            textCity.textContent = cityName || "Chọn Tỉnh/Thành phố";
            inputCity.value = cityName;
            
            textDistrict.textContent = "Chọn Quận/Huyện";
            inputDistrict.value = "";
            menuDistrict.innerHTML = '<li><a href="#" data-value="">Chọn Quận/Huyện</a></li>';
            
            textWard.textContent = "Chọn Phường/Xã";
            inputWard.value = "";
            menuWard.innerHTML = '<li><a href="#" data-value="">Chọn Phường/Xã</a></li>';

            if (!cityName) return;

            const selectedCity = provinces.find(c => c.Name === cityName);
            if (selectedCity && selectedCity.Districts) {
                let distHtml = '<li><a href="#" data-value="">Chọn Quận/Huyện</a></li>';
                selectedCity.Districts.forEach(district => {
                    distHtml += `<li><a href="#" data-value="${district.Name}">${district.Name}</a></li>`;
                });
                menuDistrict.innerHTML = distHtml;
            }
        };

        // Hàm xử lý chọn Quận
        window.handleDistrictSelect = function(districtName) {
            textDistrict.textContent = districtName || "Chọn Quận/Huyện";
            inputDistrict.value = districtName;
            
            textWard.textContent = "Chọn Phường/Xã";
            inputWard.value = "";
            menuWard.innerHTML = '<li><a href="#" data-value="">Chọn Phường/Xã</a></li>';

            const selectedCityName = inputCity.value;
            if (!selectedCityName || !districtName) return;

            const selectedCity = provinces.find(c => c.Name === selectedCityName);
            if (!selectedCity) return;
            
            const selectedDistrict = selectedCity.Districts.find(d => d.Name === districtName);
            
            if (selectedDistrict && selectedDistrict.Wards && selectedDistrict.Wards.length > 0) {
                let wardHtml = '<li><a href="#" data-value="">Chọn Phường/Xã</a></li>';
                selectedDistrict.Wards.forEach(ward => {
                    wardHtml += `<li><a href="#" data-value="${ward.Name}">${ward.Name}</a></li>`;
                });
                menuWard.innerHTML = wardHtml;
            } else {
                menuWard.innerHTML = '<li><a href="#" data-value="Không có Phường/Xã">Không có Phường/Xã</a></li>';
            }
        };

        // Hàm xử lý chọn Phường
        window.handleWardSelect = function(wardName) {
            textWard.textContent = wardName || "Chọn Phường/Xã";
            inputWard.value = wardName;
        };

        // --- TỰ ĐỘNG ĐIỀN TỪ SỔ ĐỊA CHỈ ĐÃ LƯU ---
        if (savedAddress && savedAddress.city) {
            window.handleCitySelect(savedAddress.city);
            if (savedAddress.district) {
                window.handleDistrictSelect(savedAddress.district);
                if (savedAddress.ward) {
                    window.handleWardSelect(savedAddress.ward);
                }
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu địa giới hành chính:', error);
    }
}

    // --- LOGIC ĐÓNG / MỞ MENU DROPDOWN ---
    const filterWrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    filterWrappers.forEach(wrapper => {
        const btn = wrapper.querySelector('.filter-btn');
        const popup = wrapper.querySelector('.filter-popup');
        
        if (btn && popup) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = popup.classList.contains('show');
                
                // Đóng tất cả các menu đang mở trước
                document.querySelectorAll('.filter-popup').forEach(p => p.classList.remove('show'));
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                
                if (!isOpen) {
                    popup.classList.add('show');
                    btn.classList.add('active');
                }
            });
        }
    });

    // Bắt sự kiện chọn Option bên trong Menu
    document.querySelectorAll('.filter-popup').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('a');
            if (target) {
                const value = target.getAttribute('data-value');
                
                if (menu.id === 'menuChkCity') window.handleCitySelect(value);
                else if (menu.id === 'menuChkDistrict') window.handleDistrictSelect(value);
                else if (menu.id === 'menuChkWard') window.handleWardSelect(value);
                else if (menu.id === 'menuChkDeliveryDate') { document.getElementById('textChkDeliveryDate').textContent = target.textContent; document.getElementById('chkDeliveryDate').value = value; }
                else if (menu.id === 'menuChkDeliveryTime') { document.getElementById('textChkDeliveryTime').textContent = target.textContent; document.getElementById('chkDeliveryTime').value = value; }
                
                menu.classList.remove('show');
                if(menu.previousElementSibling) menu.previousElementSibling.classList.remove('active');
            }
        });
    });
    
    document.addEventListener('click', () => { document.querySelectorAll('.filter-popup').forEach(p => p.classList.remove('show')); document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); });

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

    const storageKey = `saved_shipping_address_${currentUserId}`;

    // Hàm tải và áp dụng địa chỉ mặc định từ Server (Ưu tiên 1) hoặc LocalStorage (Ưu tiên 2)
    async function initCheckoutAddress() {
        let addressToUse = null;

        if (currentUserId !== 'guest') {
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/users/${currentUserId}`);
                const data = await res.json();
                if (data.success && data.user && data.user.addresses) {
                    const defaultAddr = data.user.addresses.find(a => a.isDefault);
                    if (defaultAddr) {
                        addressToUse = {
                            name: defaultAddr.name, phone: defaultAddr.phone,
                            city: defaultAddr.city, district: defaultAddr.district,
                            ward: defaultAddr.ward, detail: defaultAddr.detail
                        };
                    }
                }
            } catch (err) { console.error("Lỗi tải địa chỉ mặc định:", err); }
        }

        // Nếu không có địa chỉ mặc định từ Server, lấy từ LocalStorage
        if (!addressToUse) {
            const savedAddressStr = localStorage.getItem(storageKey);
            addressToUse = savedAddressStr ? JSON.parse(savedAddressStr) : null;
        }

        loadProvinces(addressToUse);

        // 2. Điền thông tin vào form
        if (addressToUse) {
            document.getElementById('chkName').value = addressToUse.name || '';
            document.getElementById('chkPhone').value = addressToUse.phone || '';
            if (document.getElementById('chkAddressDetail')) {
                document.getElementById('chkAddressDetail').value = addressToUse.detail || '';
            }
        } else if (userObj) {
            document.getElementById('chkName').value = userObj.fullName || userObj.userName || '';
        }
    }

    initCheckoutAddress();

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

        if (!city || !district || !ward) {
            if (typeof showToast === 'function') showToast("Vui lòng chọn đầy đủ địa chỉ nhận hàng!", "error");
            btnSubmit.textContent = "XÁC NHẬN ĐẶT HÀNG"; 
            btnSubmit.disabled = false; 
            return;
        }

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