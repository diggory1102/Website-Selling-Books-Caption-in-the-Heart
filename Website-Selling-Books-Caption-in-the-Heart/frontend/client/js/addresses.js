document.addEventListener('DOMContentLoaded', async () => {
    const userId = getCurrentUserId();
    if (!userId) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const addressList = document.getElementById('addressList');
    const addrModal = document.getElementById('addrModal');
    const addrForm = document.getElementById('addrForm');
    let currentEditingId = null;
    let provincesData = [];

    // 1. Tải dữ liệu Tỉnh / Quận / Phường từ Github
    async function loadProvinces() {
        try {
            const res = await fetch('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
            provincesData = await res.json();
            const citySelect = document.getElementById('addrCity');
            
            provincesData.forEach(city => {
                let opt = document.createElement('option'); opt.value = city.Name; opt.textContent = city.Name;
                citySelect.appendChild(opt);
            });

            citySelect.addEventListener('change', function() {
                const dist = document.getElementById('addrDistrict');
                const ward = document.getElementById('addrWard');
                dist.innerHTML = '<option value="">Quận/Huyện</option>';
                ward.innerHTML = '<option value="">Phường/Xã</option>';
                
                const c = provincesData.find(x => x.Name === this.value);
                if (c && c.Districts) {
                    c.Districts.forEach(d => {
                        let opt = document.createElement('option'); opt.value = d.Name; opt.textContent = d.Name; dist.appendChild(opt);
                    });
                }
            });

            document.getElementById('addrDistrict').addEventListener('change', function() {
                const ward = document.getElementById('addrWard');
                ward.innerHTML = '<option value="">Phường/Xã</option>';
                const c = provincesData.find(x => x.Name === citySelect.value);
                if (!c) return;
                const d = c.Districts.find(x => x.Name === this.value);
                if (d && d.Wards) {
                    d.Wards.forEach(w => {
                        let opt = document.createElement('option'); opt.value = w.Name; opt.textContent = w.Name; ward.appendChild(opt);
                    });
                }
            });
        } catch (err) { console.error("Lỗi tải tỉnh thành", err); }
    }
    loadProvinces();

    // 2. Lấy danh sách địa chỉ từ Server
    async function fetchAddresses() {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}`);
            const data = await res.json();
            if (data.success && data.user.addresses) renderAddresses(data.user.addresses);
        } catch (err) { console.error(err); }
    }
    fetchAddresses();

    function renderAddresses(addresses) {
        if (addresses.length === 0) {
            addressList.innerHTML = `<div class="addr-empty"><i class="fa-solid fa-map-location-dot"></i><p>Bạn chưa lưu địa chỉ nào.</p></div>`;
            return;
        }
        // Sắp xếp Mặc định lên đầu
        addresses.sort((a, b) => b.isDefault - a.isDefault);

        addressList.innerHTML = addresses.map(a => `
            <div class="addr-card">
                <div class="addr-info">
                    <div class="addr-name">${a.name} ${a.isDefault ? '<span class="addr-badge">Mặc định</span>' : ''}</div>
                    <div class="addr-phone">SĐT: ${a.phone}</div>
                    <div class="addr-detail">${a.detail}, ${a.ward}, ${a.district}, ${a.city}</div>
                </div>
                <div class="addr-actions">
                    <div>
                        <button class="btn-edit" onclick="openAddrModal('${a._id}', '${a.name}', '${a.phone}', '${a.city}', '${a.district}', '${a.ward}', '${a.detail}', ${a.isDefault})">Sửa</button>
                        ${!a.isDefault ? ` | <button class="btn-del" onclick="deleteAddress('${a._id}')">Xóa</button>` : ''}
                    </div>
                    ${!a.isDefault ? `<button class="btn-set-default" onclick="setDefault('${a._id}')">Thiết lập mặc định</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    // 3. Logic Đóng/Mở Modal
    window.openAddrModal = (id = null, name = '', phone = '', city = '', dist = '', ward = '', detail = '', isDef = false) => {
        currentEditingId = id;
        document.getElementById('modalTitle').textContent = id ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới';
        document.getElementById('addrName').value = name;
        document.getElementById('addrPhone').value = phone;
        document.getElementById('addrDetail').value = detail;
        document.getElementById('addrIsDefault').checked = isDef;

        const cityEl = document.getElementById('addrCity');
        const distEl = document.getElementById('addrDistrict');
        const wardEl = document.getElementById('addrWard');
        
        cityEl.value = city; cityEl.dispatchEvent(new Event('change'));
        setTimeout(() => { distEl.value = dist; distEl.dispatchEvent(new Event('change'));
            setTimeout(() => { wardEl.value = ward; }, 50);
        }, 50);

        addrModal.classList.add('show');
    };

    window.closeAddrModal = () => { addrModal.classList.remove('show'); addrForm.reset(); };

    // 4. Submit Form (Thêm/Sửa)
    addrForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('addrName').value, phone: document.getElementById('addrPhone').value,
            city: document.getElementById('addrCity').value, district: document.getElementById('addrDistrict').value,
            ward: document.getElementById('addrWard').value, detail: document.getElementById('addrDetail').value,
            isDefault: document.getElementById('addrIsDefault').checked
        };

        const url = currentEditingId ? `http://127.0.0.1:5000/api/users/${userId}/addresses/${currentEditingId}` : `http://127.0.0.1:5000/api/users/${userId}/addresses`;
        const method = currentEditingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (data.success) { showToast(data.message, "success"); closeAddrModal(); renderAddresses(data.addresses); }
            else showToast(data.message, "error");
        } catch (err) { showToast("Lỗi máy chủ!", "error"); }
    });

    // 5. Nút Xóa & Đặt mặc định
    window.deleteAddress = async (addrId) => {
        if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/addresses/${addrId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { showToast("Đã xóa địa chỉ", "success"); renderAddresses(data.addresses); }
        } catch (err) { showToast("Lỗi máy chủ!", "error"); }
    };

    window.setDefault = async (addrId) => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/addresses/${addrId}/default`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) { showToast("Đã thiết lập mặc định", "success"); renderAddresses(data.addresses); }
        } catch (err) { showToast("Lỗi máy chủ!", "error"); }
    };
});