document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // App Initialization
    // ==========================================================================
    const init = () => {
    initHeaderScroll();
    initHorizontalScroll();
    initResourcesData();
    initModalSystem();  
    initProductInjection();
    initPaymentSystem();
};

    // ==========================================================================
    // Header Scroll Effect
    // ==========================================================================
    const initHeaderScroll = () => {
        const header = document.getElementById('header');
        if (!header) return;

        const handleScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Trigger on load
    };

    // ==========================================================================
    // Horizontal Drag Scroll (Featured Section)
    // ==========================================================================
    const initHorizontalScroll = () => {
        const scrollContainer = document.getElementById('featured-scroll-container');
        if (!scrollContainer) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        scrollContainer.style.cursor = 'grab';

        scrollContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            scrollContainer.style.cursor = 'grabbing';
            startX = e.pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
        });

        scrollContainer.addEventListener('mouseleave', () => {
            isDown = false;
            scrollContainer.style.cursor = 'grab';
        });

        scrollContainer.addEventListener('mouseup', () => {
            isDown = false;
            scrollContainer.style.cursor = 'grab';
        });

        scrollContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 2; // Scroll multiplier
            scrollContainer.scrollLeft = scrollLeft - walk;
        });
    };

    // ==========================================================================
    // Resources Page Data Handling (Fetch, Filter, Render)
    // ==========================================================================
    const initResourcesData = () => {
        const resourcesGrid = document.getElementById('resources-grid');

        const searchInput = document.getElementById('search-input');
        const categoryFilters = document.getElementById('category-filters');
        
        let allResources = [];
        window.AllProducts = [];
      
        // Determine base path depending on if we are in root or sub-folder
        const isSubFolder = window.location.pathname.includes('/resources/') || window.location.pathname.includes('/about/');
        const dataPath = isSubFolder ? '../data/products.json' : 'data/products.json';

        const loadResources = async () => {
    try {
        const response = await fetch(dataPath);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();

        allResources = data.products || [];
        window.AllProducts = allResources;
        renderResources(allResources);
       renderFeaturedProducts(allResources); 
    } catch (error) {
        console.error('Error loading resources:', error);
        resourcesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 3rem;">
                <p>Unable to load resources. Please ensure you are running a local server.</p>
            </div>
        `;
    }
};
        const renderResources = (resources) => {

    if (!resourcesGrid) return; 

    resourcesGrid.innerHTML = '';
            if (resources.length === 0) {
                resourcesGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 3rem;">
                        <p>No resources match your search criteria.</p>
                    </div>
                `;
                return;
            }

            const fragment = document.createDocumentFragment();

            resources.forEach(res => {
                const wrapper = document.createElement('div');
                wrapper.className = 'card-wrapper';
                
                // Adjust image path based on location to prevent broken links
                const imgPath = isSubFolder ? `../${res.image}` : res.image;

                wrapper.innerHTML = `
                    <div class="card" data-product-id="${res.id}">
                        <div class="card-inner">
                            <div class="card-image-container">
                                <img data-src="${imgPath}" alt="${res.title}" class="lazy-load" style="opacity: 0; transition: opacity var(--trans-smooth);">
                            </div>
                            <span class="card-tag">${res.category}</span>
                            <h3 class="card-title">${res.title}</h3>
                            <p class="card-desc">${res.subtitle}</p>
                        </div>
                    </div>
                `;
                fragment.appendChild(wrapper);
            });

            resourcesGrid.appendChild(fragment);
            initLazyLoading();
        };

        const handleSearch = (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const activeCategoryBtn = document.querySelector('.filter-btn.active');
            const activeCategory = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'All';
            filterResources(searchTerm, activeCategory);
        };

        const handleCategoryFilter = (e) => {
            // Event Delegation
            if (!e.target.classList.contains('filter-btn')) return;

            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const activeCategory = e.target.dataset.category;
            
            filterResources(searchTerm, activeCategory);
        };

        const filterResources = (searchTerm, category) => {
            const filtered = allResources.filter(res => {
                const matchesSearch = res.title.toLowerCase().includes(searchTerm) || res.subtitle.toLowerCase().includes(searchTerm);
                const matchesCategory = category === 'All' || res.category === category;
                return matchesSearch && matchesCategory;
            });
            renderResources(filtered);
        };

        // Event Listeners for Resources UI
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        if (categoryFilters) {
            categoryFilters.addEventListener('click', handleCategoryFilter);
        }

        // Initialize fetch
        loadResources();
    };

    // ==========================================================================
    // Utilities
    // ==========================================================================
    
    // Debounce function to limit execution rate of search input
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Intersection Observer for Lazy Loading Images
    const initLazyLoading = () => {
        const lazyImages = document.querySelectorAll('.lazy-load');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        
                        // Prevent layout shift by waiting for load to display
                        img.onload = () => {
                            img.style.opacity = 1;
                            img.classList.remove('lazy-load');
                        };
                        
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: "0px 0px 50px 0px" }); // Load slightly before it enters viewport

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.style.opacity = 1;
                img.classList.remove('lazy-load');
            });
        }
    };
    // ==========================================
// FEATURED RENDER ENGINE (HOME PAGE)
// ==========================================

const renderFeaturedProducts = (products) => {

    const featuredContainer = document.getElementById('featured-scroll-container');
    if (!featuredContainer) return;

    const featured = products.filter(p => p.featured === true);

    if (featured.length === 0) return;

    featuredContainer.innerHTML = '';

    const isSubFolder =
        window.location.pathname.includes('/resources/') ||
        window.location.pathname.includes('/about/');

    featured.forEach(product => {

        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';

        const imgPath = isSubFolder
            ? `../${product.image}`
            : product.image;

        wrapper.innerHTML = `
            <div class="card" data-product-id="${product.id}">
                <div class="card-inner">
                    <div class="card-image-container">
                        <img src="${imgPath}" alt="${product.title}">
                    </div>
                    <span class="card-tag">${product.category}</span>
                    <h3 class="card-title">${product.title}</h3>
                    <p class="card-desc">${product.subtitle}</p>
                </div>
            </div>
        `;

        featuredContainer.appendChild(wrapper);
    });
};
// ==========================================
// MODAL CONTROLLER SYSTEM
// ==========================================

const initModalSystem = () => {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const verificationOverlay = document.getElementById('verification-overlay');
    const verificationClose = document.getElementById('verification-close');

    const body = document.body;

    const lockScroll = () => body.style.overflow = 'hidden';
    const unlockScroll = () => body.style.overflow = '';

    const openModal = () => {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        lockScroll();
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        unlockScroll();
    };

    const closeVerification = () => {
        verificationOverlay?.classList.add('hidden');
        unlockScroll();
    };

    overlay?.addEventListener('click', closeModal);
    closeBtn?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modal.classList.contains('hidden')) closeModal();
            if (!verificationOverlay?.classList.contains('hidden')) closeVerification();
        }
    });

    verificationClose?.addEventListener('click', closeVerification);

    if (sessionStorage.getItem('orderPending')) {
        sessionStorage.removeItem('orderPending');
        verificationOverlay?.classList.remove('hidden');
        lockScroll();
    }

    window.ProductModal = {
        open: openModal,
        close: closeModal
    };
};
// ==========================================
// PRODUCT INJECTION ENGINE
// ==========================================

const initProductInjection = () => {

    document.addEventListener('click', (e) => {

        const card = e.target.closest('.card');
        if (!card || !card.dataset.productId) return;

        const productId = card.dataset.productId;
        const product = window.AllProducts?.find(p => p.id === productId);

        if (!product) return;

        populateModal(product);
        window.ProductModal?.open();
    });
};

const populateModal = (product) => {

    const isSubFolder = window.location.pathname.includes('/resources/') || window.location.pathname.includes('/about/');
    const imgPath = isSubFolder ? `../${product.image}` : product.image;

    const imgEl = document.getElementById('modal-product-image');
    const titleEl = document.getElementById('modal-product-title');
    const subtitleEl = document.getElementById('modal-product-subtitle');
    const originalPriceEl = document.getElementById('modal-original-price');
    const finalPriceEl = document.getElementById('modal-final-price');

    const formProduct = document.getElementById('form-product');
    const formAmount = document.getElementById('form-amount');
    const formCoupon = document.getElementById('form-coupon');

    if (!imgEl) return; // safety check

    const finalPrice = product.price;
    const originalPrice = Math.round(finalPrice * 1.3);

    imgEl.src = imgPath;
    titleEl.textContent = product.title;
    subtitleEl.textContent = product.subtitle;
    originalPriceEl.textContent = `₹${originalPrice}`;
    finalPriceEl.textContent = `₹${finalPrice}`;

    formProduct.value = product.title;
formAmount.value = finalPrice;
formAmount.dataset.basePrice = finalPrice;
formCoupon.value = '';

    const couponInput = document.getElementById('coupon-input');
    const couponFeedback = document.getElementById('coupon-feedback');

    if (couponInput) couponInput.value = '';
    if (couponFeedback) couponFeedback.textContent = '';
};
// ==========================================
// PAYMENT + COUPON ENGINE (PRODUCTION SAFE)
// ==========================================

const initPaymentSystem = async () => {

    const applyBtn = document.getElementById('apply-coupon-btn');
    const couponInput = document.getElementById('coupon-input');
    const couponFeedback = document.getElementById('coupon-feedback');
    const finalPriceEl = document.getElementById('modal-final-price');
    const formAmount = document.getElementById('form-amount');
    const formCoupon = document.getElementById('form-coupon');
    const orderForm = document.getElementById('order-form');

    if (!orderForm) return;

    // ==========================
    // FETCH COUPONS FROM JSON
    // ==========================

    let couponsDB = [];

    try {
        const isSubFolder =
            window.location.pathname.includes('/resources/') ||
            window.location.pathname.includes('/about/');

        const couponPath = isSubFolder
            ? '../data/coupons.json'
            : 'data/coupons.json';

        const response = await fetch(couponPath);
        const data = await response.json();
        couponsDB = data.coupons || [];

    } catch (err) {
        console.error("Failed to load coupons.json");
    }

    // ==========================
    // APPLY COUPON LOGIC
    // ==========================

    applyBtn?.addEventListener('click', () => {

        const code = couponInput.value.trim().toUpperCase();
        const basePrice = Number(formAmount.dataset.basePrice);
        const productName = document.getElementById('form-product').value;

        const coupon = couponsDB.find(c => c.code === code);

        if (!coupon) {
            showError("Invalid coupon code");
            return;
        }

        if (!coupon.active) {
            showError("Coupon is inactive");
            return;
        }

        if (coupon.expires && new Date(coupon.expires) < new Date()) {
            showError("Coupon expired");
            return;
        }

        if (coupon.min_amount && basePrice < coupon.min_amount) {
            showError(`Minimum order ₹${coupon.min_amount} required`);
            return;
        }

        if (coupon.products !== "all" &&
            Array.isArray(coupon.products) &&
            !coupon.products.includes(productName)) {
            showError("Coupon not valid for this product");
            return;
        }

        let newPrice = basePrice;

        if (coupon.type === "percentage") {
            newPrice = Math.round(basePrice - (basePrice * coupon.value / 100));
        }

        if (coupon.type === "flat") {
            newPrice = Math.max(0, basePrice - coupon.value);
        }

        finalPriceEl.textContent = `₹${newPrice}`;
        formAmount.value = newPrice;
        formCoupon.value = coupon.code;

        // Creator tracking fields
        if (coupon.creator) {
            formDataAppendHidden(orderForm, "creator", coupon.creator);
            formDataAppendHidden(orderForm, "commission_percent", coupon.commission_percent);
        }

        couponFeedback.textContent = `Coupon applied successfully`;
        couponFeedback.style.color = "lime";
    });

    function showError(msg) {
        couponFeedback.textContent = msg;
        couponFeedback.style.color = "red";
    }

    function formDataAppendHidden(form, name, value) {
        let input = form.querySelector(`input[name="${name}"]`);
        if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            form.appendChild(input);
        }
        input.value = value;
    }

    // ==========================
    // FORM SUBMIT
    // ==========================

    orderForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const submitBtn = orderForm.querySelector('#pay-now-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";

        const formData = new FormData(orderForm);

        if (!formData.get("access_key")) {
            alert("Form configuration error.");
            submitBtn.disabled = false;
            submitBtn.innerText = "Proceed to Payment";
            return;
        }

        try {

            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error();

            const result = await response.json();
            if (!result.success) throw new Error();

            sessionStorage.setItem('orderPending', 'true');

            const amount = formAmount.value;
            const product = formData.get('product');

            const upiId = "improvet@ptaxis";
            const name = "ImproveTogether";

            const upiLink =
                `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(product)}`;

            window.location.href = upiLink;

        } catch (error) {

            alert("Something went wrong. Please try again.");
            submitBtn.disabled = false;
            submitBtn.innerText = "Proceed to Payment";
        }
    });
};
    // Boot the app 
init();
});
