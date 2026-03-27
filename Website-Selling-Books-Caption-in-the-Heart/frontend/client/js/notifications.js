document.addEventListener('DOMContentLoaded', async () => {
    const userId = getCurrentUserId();
    if (!userId) {
        if (typeof showToast === 'function') showToast("Vui lòng đăng nhập!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    const notiList = document.getElementById('notiPageList');
    const btnMarkAll = document.getElementById('btnMarkAll');

    async function loadNotifications() {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/notifications/user/${userId}`);
            const data = await res.json();
            if (data.success) renderNotifications(data.notifications);
        } catch (err) { notiList.innerHTML = '<p style="text-align:center; color:red;">Lỗi tải thông báo!</p>'; }
    }

    function renderNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            notiList.innerHTML = `<div class="noti-page-empty"><i class="fa-regular fa-bell-slash"></i><p>Bạn không có thông báo nào mới.</p></div>`;
            return;
        }

        notiList.innerHTML = notifications.map(noti => {
            let iconClass = 'fa-solid fa-bell'; // SYSTEM
            if (noti.type === 'ORDER') iconClass = 'fa-solid fa-box-open';
            else if (noti.type === 'PROMOTION') iconClass = 'fa-solid fa-ticket';

            const dateStr = new Date(noti.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

            return `
                <div class="noti-page-item ${!noti.isRead ? 'unread' : ''}" onclick="markAsRead('${noti._id}', this)">
                    <div class="noti-page-icon ${noti.type || 'SYSTEM'}"><i class="${iconClass}"></i></div>
                    <div class="noti-page-info">
                        <div class="noti-page-title">${noti.title}</div>
                        <div class="noti-page-desc">${noti.content}</div>
                        <div class="noti-page-time">${dateStr}</div>
                    </div>
                    ${!noti.isRead ? '<div class="noti-unread-dot"></div>' : ''}
                </div>
            `;
        }).join('');
    }

    window.markAsRead = async (id, element) => {
        if (!element.classList.contains('unread')) return; 
        try {
            await fetch(`http://127.0.0.1:5000/api/notifications/${id}/read`, { method: 'PUT' });
            element.classList.remove('unread');
            const dot = element.querySelector('.noti-unread-dot');
            if (dot) dot.remove();
        } catch (err) { console.error(err); }
    };

    if (btnMarkAll) btnMarkAll.addEventListener('click', async () => { try { const res = await fetch(`http://127.0.0.1:5000/api/notifications/user/${userId}/read-all`, { method: 'PUT' }); const data = await res.json(); if (data.success) { showToast(data.message, "success"); loadNotifications(); } } catch (err) { console.error(err); } });
    loadNotifications();
});