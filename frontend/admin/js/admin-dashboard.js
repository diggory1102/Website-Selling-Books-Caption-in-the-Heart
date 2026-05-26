let chartInstance = null;
let dashboardData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const userStr = localStorage.getItem('adminUser');
    const userRole = localStorage.getItem('adminRole');

    if (!userStr || (userRole !== 'admin' && userRole !== 'staff')) {
        alert("Truy cập bị từ chối! Vui lòng đăng nhập bằng tài khoản Quản trị.");
        window.location.href = "admin-login.html";
        return;
    }

    // 2. Thiết lập ngày mặc định (7 ngày qua)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const pad = (num) => String(num).padStart(2, '0');
    const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const startDateInput = document.getElementById('filterStartDate');
    const endDateInput = document.getElementById('filterEndDate');
    if (startDateInput && endDateInput) {
        startDateInput.value = formatDate(sevenDaysAgo);
        endDateInput.value = formatDate(today);
    }

    // 3. Đăng ký sự kiện lọc
    const btnFilter = document.getElementById('btnFilterStats');
    if (btnFilter) {
        btnFilter.addEventListener('click', async () => {
            await fetchDashboardData();
        });
    }

    // 4. Tải dữ liệu Dashboard
    await fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const startDateInput = document.getElementById('filterStartDate');
        const endDateInput = document.getElementById('filterEndDate');
        
        let url = 'http://localhost:5000/api/stats/dashboard';
        if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
            url += `?startDate=${startDateInput.value}&endDate=${endDateInput.value}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            dashboardData = data;
            
            // Hiện biểu đồ và ẩn thông báo trống
            document.getElementById('empty-chart').style.display = 'none';
            document.getElementById('chart-container').style.display = 'block';
            
            updateSummaryCards(data.summary);
            
            // Vẽ biểu đồ cho tab hiện đang active
            const isRevenueActive = document.getElementById('tab-revenue').classList.contains('active');
            if (isRevenueActive) {
                renderRevenueChart();
            } else {
                renderDistributionChart();
            }
        } else {
            document.getElementById('empty-chart').style.display = 'flex';
            document.getElementById('chart-container').style.display = 'none';
        }
    } catch (err) { 
        console.error("Lỗi Dashboard:", err); 
        document.getElementById('empty-chart').style.display = 'flex';
        document.getElementById('chart-container').style.display = 'none';
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
                backgroundColor: ['#a855f7', '#f97316', '#3b82f6', '#22c55e', '#ef4444'],
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