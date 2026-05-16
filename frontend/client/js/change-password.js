document.addEventListener('DOMContentLoaded', () => {
    const userId = getCurrentUserId();
    if (!userId) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const passwordForm = document.getElementById('passwordForm');
    const btnChangePassword = document.getElementById('btnChangePassword');

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('pfCurrentPassword').value;
            const newPassword = document.getElementById('pfNewPassword').value;
            const confirmPassword = document.getElementById('pfConfirmPassword').value;

            if (newPassword !== confirmPassword) {
                if (typeof showToast === 'function') showToast("Mật khẩu xác nhận không khớp!", "error");
                return;
            }

            btnChangePassword.disabled = true;
            btnChangePassword.textContent = 'ĐANG XỬ LÝ...';

            try {
                const res = await fetch(`http://127.0.0.1:5000/api/users/${userId}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();

                if (data.success) {
                    if (typeof showToast === 'function') showToast("🎉 " + data.message, "success");
                    passwordForm.reset(); 
                } else {
                    if (typeof showToast === 'function') showToast(data.message, "error");
                }
            } catch (err) {
                if (typeof showToast === 'function') showToast("Lỗi kết nối máy chủ!", "error");
            } finally { btnChangePassword.disabled = false; btnChangePassword.textContent = 'XÁC NHẬN ĐỔI'; }
        });
    }
});