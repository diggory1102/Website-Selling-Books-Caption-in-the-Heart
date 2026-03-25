document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('productTrack');
    const newMangaGrid = document.getElementById('newMangaGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    let currentPage = 1;

    // ==========================================
    // 1. TẢI SẢN PHẨM BEST SELLER & VẼ SAO ĐỘNG TỪ DB
    // ==========================================
    async function loadBestSellers() {
        if (!track) return;
        try {
            await fetchUserWishlist(); 
            const response = await fetch('http://127.0.0.1:5000/api/products/best-sellers');
            const products = await response.json();
            
            if (!products || products.length === 0) {
                track.innerHTML = '<p>Đang cập nhật truyện...</p>';
                return;
            }

            track.innerHTML = products.map(item => {
                const productId = String(item.id || item._id);
                const isLiked = typeof globalWishlist !== 'undefined' && globalWishlist.includes(productId);
                const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
                const heartColor = isLiked ? '#e74c3c' : '#ccc';

                const rating = item.averageRating || 0; 
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                    else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                    else starsHtml += '<i class="fa-regular fa-star"></i>';
                }

                let origPrice = item.price;
                let fnPrice = origPrice;
                if (item.discount && item.discount.includes('%')) {
                    let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                    if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
                }
                const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
                const oldPriceHtml = fnPrice < origPrice ? `<span class="old">${Number(origPrice).toLocaleString()}đ</span>` : '';

                return `
                <div class="product-card" style="position: relative;">
                    <div class="wishlist-btn" onclick="toggleWishlist(event, '${productId}')" style="position: absolute; top: 10px; right: 10px; z-index: 999; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;">
                        <i class="${heartClass} fa-heart" style="color: ${heartColor}; transition: 0.2s;"></i>
                    </div>
                    <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit; display: block;">
                        <div class="img-box">
                            ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                            <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='https://placehold.jp/200x250.png?text=No+Image';" alt="${item.name}">
                        </div>
                        <div class="info-box">
                            <h3 class="name">${item.name}</h3>
                            <div class="author" style="font-size: 13px; margin-bottom: 8px;">
                                ${item.authorName ? `<span style="color: #007bff;"><i class="fa-solid fa-pen-nib"></i> ${item.authorName}</span>` : '<span style="color: #666;">Đang cập nhật</span>'}
                            </div>
                            <div class="stars">${starsHtml} <span style="color: #888; font-size: 11px; margin-left: 5px;">(${item.totalReviews || 0})</span> <span class="sold-count">| Đã bán ${item.sold || 0}</span></div>
                            <div class="price-group"><span class="now">${priceFormatted}</span>${oldPriceHtml}</div>
                        </div>
                    </a>
                </div>`;
            }).join('');
            initCarousel(products.length); 
        } catch (error) { console.error("Lỗi Best Seller:", error); }
    }

    // ==========================================
    // 2. TẢI TRUYỆN MỚI CẬP NHẬT
    // ==========================================
    async function fetchNewManga(page) {
        if (!newMangaGrid) return;
        try {
            if (typeof fetchUserWishlist === "function") await fetchUserWishlist(); 
            const response = await fetch(`http://127.0.0.1:5000/api/products/newest?page=${page}&limit=4`);
            const products = await response.json();

            if (products.length === 0 || products.length < 4) {
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            }

            products.forEach(item => {
                const productId = String(item.id || item._id);
                const isLiked = typeof globalWishlist !== 'undefined' && globalWishlist.includes(productId);
                const heartClass = isLiked ? 'fa-solid' : 'fa-regular';
                const heartColor = isLiked ? '#e74c3c' : '#ccc';

                const rating = item.rating || 0;
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= Math.floor(rating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                    else if (i - 0.5 <= rating) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                    else starsHtml += '<i class="fa-regular fa-star"></i>';
                }

                let origPrice = item.price;
                let fnPrice = origPrice;
                if (item.discount && item.discount.includes('%')) {
                    let dVal = parseFloat(item.discount.replace(/[^0-9.]/g, ''));
                    if (!isNaN(dVal)) fnPrice = origPrice - (origPrice * dVal / 100);
                }
                const priceFormatted = Number(fnPrice).toLocaleString() + 'đ';
                const oldPriceHtml = fnPrice < origPrice ? `<span class="old">${Number(origPrice).toLocaleString()}đ</span>` : '';

                const card = document.createElement('div');
                card.className = 'product-card';
                card.style.position = 'relative';
                card.innerHTML = `
                    <div class="wishlist-btn" onclick="toggleWishlist(event, '${productId}')" style="position: absolute; top: 10px; right: 10px; z-index: 999; background: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;">
                        <i class="${heartClass} fa-heart" style="color: ${heartColor}; transition: 0.2s;"></i>
                    </div>
                    ${item.isNew ? `<span class="new-badge">Mới</span>` : ''}
                    <a href="product-detail.html?id=${productId}" style="text-decoration: none; color: inherit; display: block; height: 100%;">
                        <div class="img-box">
                            ${item.discount ? `<span class="sale-tag">${item.discount}</span>` : ''}
                            <img src="${item.imageUrl}" onerror="this.onerror=null; this.src='https://placehold.co/200x250?text=No+Image';">
                        </div>
                        <div class="info-box">
                            <h3 class="name">${item.name}</h3>
                            <div class="author" style="font-size: 13px; margin-bottom: 8px;">
                                ${item.authorName ? `<span style="color: #007bff;"><i class="fa-solid fa-pen-nib"></i> ${item.authorName}</span>` : '<span style="color: #666;">Đang cập nhật</span>'}
                            </div>
                            <div class="stars">${starsHtml} <span style="color: #888; font-size: 11px; margin-left: 5px;">(${item.totalReviews || 0})</span> <span class="sold-count">| Đã bán ${item.sold || 0}</span></div>
                            <div class="price-group"><span class="now">${priceFormatted}</span>${oldPriceHtml}</div>
                        </div>
                    </a>`;
                newMangaGrid.appendChild(card);
            });
        } catch (error) { console.error("Lỗi khi tải truyện mới:", error); }
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++; 
            fetchNewManga(currentPage); 
            loadMoreBtn.style.display = 'none';
            const viewAllBtn = document.getElementById('viewAllNewestBtn');
            if (viewAllBtn) viewAllBtn.style.display = 'inline-block';
        });
    }

    // ==========================================
    // 3. LOGIC CAROUSEL
    // ==========================================
    function initCarousel(originalLength) {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        if (!track || !nextBtn || !prevBtn || originalLength === 0) return;
        const firstCard = track.querySelector('.product-card');
        if (!firstCard) return;
        let cardWidth = firstCard.offsetWidth + 20, index = 0;
        Array.from(track.children).forEach(card => track.appendChild(card.cloneNode(true)));
        const moveSlider = () => { track.style.transition = "transform 0.5s ease-in-out"; track.style.transform = `translateX(-${index * cardWidth}px)`; };
        track.addEventListener('transitionend', () => {
            if (index >= originalLength) { track.style.transition = "none"; index = 0; track.style.transform = `translateX(0)`; }
            if (index < 0) { track.style.transition = "none"; index = originalLength - 1; track.style.transform = `translateX(-${index * cardWidth}px)`; }
        });
        nextBtn.onclick = () => { index++; moveSlider(); };
        prevBtn.onclick = () => { index--; moveSlider(); };
        window.addEventListener('resize', () => { cardWidth = firstCard.offsetWidth + 20; moveSlider(); });
    }

    // ==========================================
    // 4. HERO BANNER SLIDER
    // ==========================================
    const bannerSlides = document.querySelector('.banner-slides');
    const dots = document.querySelectorAll('.banner-dots .dot');
    const bannerPrev = document.getElementById('bannerPrev');
    const bannerNext = document.getElementById('bannerNext');
    if (bannerSlides && dots.length > 0) {
        let currentSlide = 0;
        const totalSlides = dots.length;
        const updateSlide = (index) => {
            if (index < 0) index = totalSlides - 1;
            if (index >= totalSlides) index = 0;
            bannerSlides.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach(dot => dot.style.background = 'rgba(255,255,255,0.5)');
            dots[index].style.background = '#ffffff';
            currentSlide = index;
        };
        let slideInterval = setInterval(() => updateSlide(currentSlide + 1), 3000);
        const resetInterval = () => { clearInterval(slideInterval); slideInterval = setInterval(() => updateSlide(currentSlide + 1), 3000); };
        dots.forEach((dot, index) => { dot.addEventListener('click', () => { updateSlide(index); resetInterval(); }); });
        if (bannerPrev) bannerPrev.addEventListener('click', () => { updateSlide(currentSlide - 1); resetInterval(); });
        if (bannerNext) bannerNext.addEventListener('click', () => { updateSlide(currentSlide + 1); resetInterval(); });
    }

    // Khởi chạy khi vào trang chủ
    loadBestSellers();
    fetchNewManga(currentPage);
});