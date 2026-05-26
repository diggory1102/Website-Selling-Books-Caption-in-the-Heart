// js/admin-login.js

document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const messageBox = document.getElementById('messageBox');

    // Hiện trạng thái đang xử lý
    messageBox.style.display = 'block';
    messageBox.className = 'message'; // reset class
    messageBox.textContent = 'Đang xác thực qua hệ thống C++...';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // HIỂN THỊ THÀNH CÔNG (Câu chào từ C++ trả về)
            messageBox.className = 'message success';
            messageBox.textContent = "✅ " + data.message;

            // Lưu thông tin vào bộ nhớ
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            localStorage.setItem('adminRole', data.role); // 'admin' hoặc 'staff'

            // Chuyển hướng sau 1.5 giây để kịp nhìn thông báo
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html'; 
            }, 1500);

        } else {
            // HIỂN THỊ LỖI (Bị C++ từ chối hoặc sai tài khoản)
            messageBox.className = 'message error';
            messageBox.textContent = "❌ " + (data.message || "Truy cập bị từ chối!");
        }
    } catch (error) {
        messageBox.className = 'message error';
        messageBox.textContent = "❌ Lỗi kết nối Server!";
        console.error("Lỗi:", error);
    }
});