document.addEventListener('DOMContentLoaded', function() {
    // 1. Xử lý Nút Danh mục (Giữ nguyên logic cũ)
    const categoryBtn = document.getElementById('categoryBtn');
    const categoryMenu = document.getElementById('categoryMenu');

    if (categoryBtn && categoryMenu) {
        categoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryMenu.classList.toggle('show');
            categoryBtn.classList.toggle('active');
        });
        document.addEventListener('click', () => {
            categoryMenu.classList.remove('show');
            categoryBtn.classList.remove('active');
        });
    }

    // 2. GỌI API VÀ ĐỔ DỮ LIỆU THỰC TẾ
    const track = document.getElementById('productTrack');
    
    async function loadBestSellers() {
        try {
            // Gọi đến địa chỉ Backend bạn vừa chạy thành công
            const response = await fetch('http://localhost:5000/api/products/best-sellers');
            const products = await response.json();

            if (products.length === 0) return;

            // Xóa trắng track trước khi đổ dữ liệu
            track.innerHTML = '';

            // Vẽ từng thẻ truyện dựa trên dữ liệu từ SQL Server
            products.forEach(item => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="img-box">
                        ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                        <img src="${item.imageUrl || 'https://via.placeholder.com/200x250/f8f9fa/ccc?text=Book'}" alt="${item.name}">
                    </div>
                    <div class="info-box">
                        <h3 class="name">${item.name}</h3>
                        <div class="stars">
                            ${renderStars(4.5)} 
                            <span class="sold-count">| Đã bán ${item.sold || 0}</span>
                        </div>
                        <div class="price-group">
                            <span class="now">${Number(item.price).toLocaleString()}đ</span>
                        </div>
                    </div>
                `;
                track.appendChild(card);
            });

            // SAU KHI VẼ XONG MỚI CHẠY CAROUSEL
            initCarousel(products.length);

        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu thực tế:", error);
            track.innerHTML = '<p style="padding: 20px;">Không thể tải dữ liệu truyện...</p>';
        }
    }

    // 3. LOGIC CAROUSEL VÔ HẠN (Đã tối ưu cho dữ liệu động)
    function initCarousel(originalLength) {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const cards = Array.from(track.children);
        
        if (cards.length === 0) return;

        const cardWidth = cards[0].offsetWidth + 20; 
        let index = 0;

        // Nhân bản để tạo vòng lặp vô hạn
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
        });

        function updateSlider() {
            track.style.transition = "transform 0.5s ease-in-out";
            track.style.transform = `translateX(-${index * cardWidth}px)`;

            if (index >= originalLength) {
                setTimeout(() => {
                    track.style.transition = "none";
                    index = 0;
                    track.style.transform = `translateX(0)`;
                }, 500);
            }
        }

        nextBtn.onclick = () => { index++; updateSlider(); };
        prevBtn.onclick = () => {
            if (index <= 0) {
                index = originalLength;
                track.style.transition = "none";
                track.style.transform = `translateX(-${index * cardWidth}px)`;
                track.offsetWidth; 
            }
            index--;
            updateSlider();
        };
    }

    // Hàm vẽ sao
    function renderStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) starsHtml += '<i class="fa-solid fa-star"></i>';
            else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
            else starsHtml += '<i class="fa-regular fa-star"></i>';
        }
        return starsHtml;
    }

    // Chạy hàm load dữ liệu
    loadBestSellers();
});