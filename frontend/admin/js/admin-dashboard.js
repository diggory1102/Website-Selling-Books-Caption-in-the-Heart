let chartInstance = null;
let dashboardData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const userStr = localStorage.getItem('currentUser');
    const userRole = localStorage.getItem('userRole');

    if (!userStr || (userRole !== 'admin' && userRole !== 'staff')) {
        alert("Truy cập bị từ chối! Vui lòng đăng nhập bằng tài khoản Quản trị.");
        window.location.href = "admin-login.html";
        return;
    }

    // 2. Tải dữ liệu Dashboard
    await fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const res = await fetch('http://localhost:5000/api/stats/dashboard');
        const data = await res.json();

        if (data.success) {
            dashboardData = data;
            updateSummaryCards(data.summary);
            renderRevenueChart(); // Mặc định hiện biểu đồ doanh thu
        } else {
            document.getElementById('empty-chart').style.display = 'flex';
            document.getElementById('chart-container').style.display = 'none';
        }
    } catch (err) { 
        console.error("Lỗi Dashboard:", err); 
        document.getElementById('empty-chart').style.display = 'flex';
    }
}

function updateSummaryCards(summary) {
    if (document.getElementById('statRevenue')) {
        document.getElementById('statRevenue').textContent = Number(summary.totalRevenue).toLocaleString() + ' đ';
    }
    if (document.getElementById('statOrders')) {
        document.getElementById('statOrders').textContent = summary.totalOrders + ' đơn';
    }
    if (document.getElementById('statUsers')) {
        document.getElementById('statUsers').textContent = summary.totalUsers + ' người';
    }
}

function renderRevenueChart() {
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const labels = dashboardData.revenueChart.map(item => item.date);
    const values = dashboardData.revenueChart.map(item => item.revenue);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: values,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4F46E5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => value.toLocaleString() + 'đ' },
                    grid: { color: '#f3f4f6' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderDistributionChart() {
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const labels = Object.keys(dashboardData.statusDistribution);
    const values = Object.values(dashboardData.statusDistribution);

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            },
            cutout: '70%'
        }
    });
}

function switchTab(type) {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    if (type === 'revenue') {
        document.getElementById('tab-revenue').classList.add('active');
        renderRevenueChart();
    } else {
        document.getElementById('tab-distribution').classList.add('active');
        renderDistributionChart();
    }
}