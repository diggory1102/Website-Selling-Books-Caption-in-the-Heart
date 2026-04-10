document.addEventListener('DOMContentLoaded', async () => {
    const userId = getCurrentUserId();
    if (!userId) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const form = document.getElementById('profileForm');
    const inputUserName = document.getElementById('pfUserName');
    const inputFullName = document.getElementById('pfFullName');
    const inputEmail = document.getElementById('pfEmail');
    const inputPhone = document.getElementById('pfPhone');
    const inputDob = document.getElementById('pfDob');
    const btnSave = document.getElementById('btnSaveProfile');
    const avatarImg = document.getElementById('sidebarAvatar');
    
    // UI Lỗi
    const errFullName = document.getElementById('errFullName');
    const errEmail = document.getElementById('errEmail');
    const errPhone = document.getElementById('errPhone');
    const errDob = document.getElementById('errDob');

    // Chặn lịch: ngày sinh <= 13 năm trước
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    inputDob.max = maxDate.toISOString().split('T')[0];

    let currentAvatarBase64 = null; // Biến lưu tạm chuỗi ảnh

    // 1. Tải dữ liệu hồ sơ từ DB
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}`);
        const data = await res.json();
        
        if (data.success) {
            const u = data.user;
            inputUserName.value = u.userName; // Không cho sửa
            inputFullName.value = u.fullName || '';
            inputEmail.value = u.email || '';
            inputPhone.value = u.numberPhone || '';
            inputDob.value = u.dateOfBirth || '';
            
            if (u.avatar) {
                avatarImg.src = u.avatar;
                currentAvatarBase64 = u.avatar;
            }

            // --- HIỂN THỊ THỐNG KÊ VÀ HẠNG THÀNH VIÊN ---
            if (data.stats) {
                const s = data.stats;
                document.getElementById('userTier').textContent = s.tier;
                document.getElementById('quarterTextOrder').textContent = `Đơn thành công (Quý ${s.currentQuarter})`;
                document.getElementById('quarterTextMoney').textContent = `Chi tiêu (Quý ${s.currentQuarter})`;
                document.getElementById('quarterOrders').textContent = `${s.quarterOrderCount} đơn`;
                document.getElementById('quarterSpent').textContent = `${Number(s.quarterSpent).toLocaleString()}đ`;
                
                // Đổi màu giao diện theo cấp bậc
                const tierCard = document.querySelector('.tier-card');
                const tierIcon = document.querySelector('.stat-icon.tier');
                const tierText = document.querySelector('.tier-name');
                
                if (s.tier === 'Kim Cương') {
                    tierCard.style.background = 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)';
                    tierCard.style.borderColor = '#80deea'; tierIcon.style.color = '#00bcd4'; tierText.style.color = '#0097a7';
                } else if (s.tier === 'Vàng') {
                    // Mặc định CSS đã là màu Vàng cực đẹp
                } else if (s.tier === 'Bạc') {
                    tierCard.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
                    tierCard.style.borderColor = '#bdc3c7'; tierIcon.style.color = '#7f8c8d'; tierText.style.color = '#7f8c8d';
                } else if (s.tier === 'Đồng') {
                    tierCard.style.background = 'linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%)';
                    tierCard.style.borderColor = '#ffab91'; tierIcon.style.color = '#d84315'; tierText.style.color = '#bf360c';
                } else {
                    tierCard.style.background = 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)';
                    tierCard.style.borderColor = '#eee'; tierIcon.style.color = '#95a5a6'; tierText.style.color = '#7f8c8d';
                }
            }
        }
    } catch (err) {
        if (typeof showToast === 'function') showToast("Không thể tải thông tin hồ sơ!", "error");
    }

    // 1.5 Xử lý thao tác chọn Ảnh (Tự động nén ảnh bằng Canvas)
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                if (typeof showToast === 'function') showToast('Vui lòng chọn file hình ảnh!', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 250; // Kích thước nén tối đa 250px
                    let width = img.width, height = img.height;
                    if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
                    else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    currentAvatarBase64 = canvas.toDataURL('image/jpeg', 0.8); // Nén JPEG chất lượng 80%
                    avatarImg.src = currentAvatarBase64; // Hiển thị preview ngay
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 2. Xử lý nút Lưu thay đổi
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isValid = true;
        if(errFullName) errFullName.style.display = 'none';
        if(errEmail) errEmail.style.display = 'none';
        if(errPhone) errPhone.style.display = 'none';
        if(errDob) errDob.style.display = 'none';

        const rawFullName = inputFullName.value.trim();
        const rawEmail = inputEmail.value.trim();
        const rawPhone = inputPhone.value.trim();
        const rawDob = inputDob.value;

        // Validation Họ Tên: >= 2 ký tự, không chứa số/ký tự đặc biệt (chấp nhận chữ tiếng Việt)
        const nameRegex = /^[a-zA-ZÀ-Ỹà-ỹ\s]+$/;
        if (rawFullName && rawFullName.length < 2) {
            if(errFullName) { errFullName.textContent = 'Họ và tên phải có ít nhất 2 ký tự.'; errFullName.style.display = 'block'; }
            isValid = false;
        } else if (rawFullName && !nameRegex.test(rawFullName)) {
            if(errFullName) { errFullName.textContent = 'Họ và tên không hợp lệ (không chứa số hoặc ký tự đặc biệt).'; errFullName.style.display = 'block'; }
            isValid = false;
        }

        // Validation SĐT: Bắt buộc, chuỗi 10 số bắt đầu bằng 0
        const phoneRegex = /^0\d{9}$/;
        if (!rawPhone) {
            if(errPhone) { errPhone.textContent = 'Vui lòng nhập số điện thoại (Bắt buộc).'; errPhone.style.display = 'block'; }
            isValid = false;
        } else if (!phoneRegex.test(rawPhone)) {
            if(errPhone) { errPhone.textContent = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và gồm 10 chữ số).'; errPhone.style.display = 'block'; }
            isValid = false;
        }

        // Validation Ngày sinh: Yêu cầu tối thiểu 13 tuổi
        if (rawDob) {
            const dobDate = new Date(rawDob);
            const ageInMs = Date.now() - dobDate.getTime();
            const ageDate = new Date(ageInMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            
            if (dobDate > new Date()) {
                if(errDob) { errDob.textContent = 'Ngày sinh không thể ở tương lai.'; errDob.style.display = 'block'; }
                isValid = false;
            } else if (age < 13) {
                if(errDob) { errDob.textContent = 'Bạn phải từ 13 tuổi trở lên để sử dụng hệ thống.'; errDob.style.display = 'block'; }
                isValid = false;
            }
        }

        if (!isValid) return; // Dừng lại nếu lỗi

        btnSave.disabled = true;
        btnSave.textContent = 'ĐANG LƯU...';

        const payload = {
            fullName: rawFullName,
            email: rawEmail,
            numberPhone: rawPhone,
            dateOfBirth: rawDob,
            avatar: currentAvatarBase64
        };

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                if (typeof showToast === 'function') showToast(data.message, "success");
                // Cập nhật lại Tên hiển thị trên Header (Nếu có đổi tên)
                const userNameDisplay = document.getElementById('userNameDisplay');
                if (userNameDisplay) userNameDisplay.textContent = `Chào, ${data.user.fullName || data.user.userName}`;
                
                // Cập nhật lại LocalStorage để Header lập tức nhận diện ảnh mới
                const userStr = localStorage.getItem('currentUser');
                if (userStr) {
                    const uLocal = JSON.parse(userStr);
                    uLocal.fullName = data.user.fullName;
                    if (data.user.avatar) {
                        uLocal.avatar = data.user.avatar;
                        uLocal.picture = data.user.avatar; // Đè luôn link google
                        uLocal.photo = data.user.avatar; // Đè luôn link facebook
                    }
                    localStorage.setItem('currentUser', JSON.stringify(uLocal));
                    if (typeof checkLoginStatus === 'function') checkLoginStatus(); // Render lại Header ngay
                }
            } else {
                if (typeof showToast === 'function') showToast(data.message, "error");
            }
        } catch (err) {
            if (typeof showToast === 'function') showToast("Lỗi kết nối máy chủ!", "error");
        } finally { btnSave.disabled = false; btnSave.textContent = 'LƯU THAY ĐỔI'; }
    });
});