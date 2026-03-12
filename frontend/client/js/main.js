document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 1. XỬ LÝ NÚT DANH MỤC
    // ==========================================
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

    // ==========================================
    // 2. TẢI DỮ LIỆU BEST SELLER
    // ==========================================
    const track = document.getElementById('productTrack');
    
    async function loadBestSellers() {
        try {
            const response = await fetch('http://localhost:5000/api/products/best-sellers');
            const products = await response.json();

            if (products.length === 0) return;

            track.innerHTML = '';

            products.forEach(item => {
                const card = document.createElement('div');
                card.className = 'product-card';
                // Đã cập nhật link ảnh dự phòng cực chuẩn, không lỗi 404
                card.innerHTML = `
                    <div class="img-box">
                        ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                        <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22250%22%20viewBox%3D%220%200%20200%20250%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e0e0e0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20fill%3D%22%23888888%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';" alt="${item.name}">
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

            initCarousel(products.length);

        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu Best Seller:", error);
            if (track) track.innerHTML = '<p style="padding: 20px;">Không thể tải dữ liệu truyện...</p>';
        }
    }

    function initCarousel(originalLength) {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const cards = Array.from(track.children);
        
        if (cards.length === 0 || !nextBtn || !prevBtn) return;

        const cardWidth = cards[0].offsetWidth + 20; 
        let index = 0;

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

    function renderStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) starsHtml += '<i class="fa-solid fa-star"></i>';
            else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
            else starsHtml += '<i class="fa-regular fa-star"></i>';
        }
        return starsHtml;
    }

    // Chạy hàm load dữ liệu nếu có id productTrack
    if (track) {
        loadBestSellers();
    }

    // ==========================================
    // 3. XỬ LÝ TÌM KIẾM TRỰC TIẾP (LIVE SEARCH)
    // ==========================================
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let timeoutId;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim();

            if (keyword.length === 0) {
                searchResults.classList.remove('show');
                return;
            }

            clearTimeout(timeoutId);

            timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(keyword)}`);
                    const products = await response.json();

                    if (products.length > 0) {
                        searchResults.innerHTML = products.map(item => {
                            const imageSrc = item.imageUrl ? item.imageUrl : ''; 
                            return `
                                <a href="#" class="search-item">
                                        <img src="${imageSrc}" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2255%22%20viewBox%3D%220%200%2040%2055%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e0e0e0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2210%22%20fill%3D%22%23888888%22%3EImg%3C%2Ftext%3E%3C%2Fsvg%3E';" alt="${item.productName}">                                    <div class="search-info">
                                        <div class="s-name">${item.productName}</div>
                                        <div class="s-author"><i class="fa-solid fa-pen-nib"></i> ${item.authorName || 'Đang cập nhật'}</div>
                                        <div class="s-price">${Number(item.price).toLocaleString()}đ</div>
                                    </div>
                                </a>
                            `;
                        }).join('');
                        searchResults.classList.add('show');
                    } else {
                        searchResults.innerHTML = `<div style="padding: 15px; text-align: center; color: #888;">Không tìm thấy truyện hoặc tác giả "${keyword}"</div>`;
                        searchResults.classList.add('show');
                    }
                } catch (error) {
                    console.error("Lỗi khi tìm kiếm:", error);
                }
            }, 300);
        });

        // Ẩn bảng kết quả khi click ra ngoài
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('show');
            }
        });
    }
});

// ==========================================
    // 4. XỬ LÝ NÚT THÔNG BÁO
    // ==========================================
    const notiBtn = document.getElementById('notiBtn');
    const notiDropdown = document.getElementById('notiDropdown');

    if (notiBtn && notiDropdown) {
        notiBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation(); // Ngăn sự kiện click bị lây lan ra ngoài
            
            // Bật/tắt class 'show' để hiện/ẩn bảng
            notiDropdown.classList.toggle('show');
        });

        // Bấm vào bên trong bảng thông báo thì không bị đóng lại
        notiDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Bấm ra chỗ khác trên trang web -> Tự động đóng bảng thông báo
        document.addEventListener('click', function(e) {
            if (!notiBtn.contains(e.target)) {
                notiDropdown.classList.remove('show');
            }
        });
    }

    // ==========================================
    // 5. XỬ LÝ NÚT DROPDOWN TÀI KHOẢN
    // ==========================================
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');

    if (accountBtn && accountDropdown) {
        accountBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation(); 
            
            // Mẹo UI: Nếu bảng Thông báo đang mở, tự động đóng nó lại để đỡ rối mắt
            const notiDropdown = document.getElementById('notiDropdown');
            if(notiDropdown && notiDropdown.classList.contains('show')) {
                notiDropdown.classList.remove('show');
            }

            // Bật/tắt menu tài khoản
            accountDropdown.classList.toggle('show');
        });

        // Click bên trong menu không bị đóng
        accountDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Bấm ra chỗ khác -> Đóng menu tài khoản
        document.addEventListener('click', function(e) {
            if (!accountBtn.contains(e.target)) {
                accountDropdown.classList.remove('show');
            }
        });
    }