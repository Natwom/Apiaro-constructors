// Apiaro Constructors - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }, 500);

    initNavigation();
    initScrollAnimations();
    initStatsCounter();
    
    if (document.getElementById('featuredProjects')) loadFeaturedProjects();
    if (document.getElementById('projectsGrid')) loadAllProjects();
    if (document.getElementById('productsGrid')) loadAllProducts();
    if (typeof updateCartUI === 'function') updateCartUI();
});

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    animatedElements.forEach(el => observer.observe(el));
}

function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + (target > 100 ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// Safe image URL getter with multiple fallbacks - FIXED
function getSafeImageUrl(item) {
    if (!item) return 'assets/images/placeholder.jpg';
    
    // Check api processed image_url first (now properly returned by backend)
    if (item.image_url && item.image_url !== 'undefined' && item.image_url !== 'null' && item.image_url !== '') {
        // If it's already a full URL, return it
        if (item.image_url.startsWith('http')) {
            return item.image_url;
        }
        // Otherwise process it
        if (window.api && window.api.getImageUrl) {
            return window.api.getImageUrl(item.image_url);
        }
        return item.image_url;
    }
    
    // Try images array if image_url is empty
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const firstImg = item.images[0];
        if (firstImg && firstImg !== 'undefined' && firstImg !== 'null' && firstImg !== '') {
            if (window.api && window.api.getImageUrl) {
                return window.api.getImageUrl(firstImg);
            }
            return firstImg;
        }
    }
    
    // Try other legacy properties
    const possible = [item.image, item.thumbnail, item.photo, item.cover_image];
    for (const img of possible) {
        if (img && img !== 'undefined' && img !== 'null' && img !== '') {
            if (window.api && window.api.getImageUrl) {
                return window.api.getImageUrl(img);
            }
            return img;
        }
    }
    
    return 'assets/images/placeholder.jpg';
}

// Load Featured Projects
async function loadFeaturedProjects() {
    const container = document.getElementById('featuredProjects');
    if (!container) return;
    
    try {
        const projects = await api.getProjects({ featured: true });
        
        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-center">No featured projects found.</p>';
            return;
        }
        
        container.innerHTML = projects.slice(0, 3).map(project => {
            const imageUrl = getSafeImageUrl(project);
            
            return `
            <div class="project-card animate-on-scroll">
                <div class="project-image">
                    <img src="${imageUrl}" alt="${project.title || 'Project'}" 
                         onerror="this.onerror=null; this.src='assets/images/placeholder.jpg';">
                    <div class="project-overlay">
                        <a href="projects.html" class="view-project">View Details</a>
                    </div>
                </div>
                <div class="project-info">
                    <h3>${project.title || 'Untitled'}</h3>
                    <p class="project-location"><i class="fas fa-map-marker-alt"></i> ${project.location || 'Location not specified'}</p>
                    <span class="project-status status-${project.status || 'unknown'}">${project.status || 'Unknown'}</span>
                </div>
            </div>
        `}).join('');
        
        initScrollAnimations();
    } catch (error) {
        console.error('Error loading featured projects:', error);
        container.innerHTML = '<p class="text-center">Failed to load projects.</p>';
    }
}

// Load All Projects
async function loadAllProjects() {
    const container = document.getElementById('projectsGrid');
    if (!container) return;
    
    try {
        const projects = await api.getProjects();
        
        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-center">No projects found.</p>';
            return;
        }
        
        container.innerHTML = projects.map(project => {
            const imageUrl = getSafeImageUrl(project);
            
            return `
            <div class="project-card animate-on-scroll">
                <div class="project-image">
                    <img src="${imageUrl}" alt="${project.title || 'Project'}" 
                         onerror="this.onerror=null; this.src='assets/images/placeholder.jpg';">
                    <div class="project-overlay">
                        <a href="project-detail.html?id=${project.id}" class="view-project">View Details</a>
                    </div>
                </div>
                <div class="project-info">
                    <h3>${project.title || 'Untitled'}</h3>
                    <p class="project-location"><i class="fas fa-map-marker-alt"></i> ${project.location || 'Location not specified'}</p>
                    <span class="project-status status-${project.status || 'unknown'}">${project.status || 'Unknown'}</span>
                </div>
            </div>
        `}).join('');
        
        initScrollAnimations();
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<p class="text-center">Failed to load projects.</p>';
    }
}

// Load All Products
async function loadAllProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    try {
        const products = await api.getProducts();
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="text-center">No products found.</p>';
            return;
        }
        
        container.innerHTML = products.map(product => {
            const imageUrl = getSafeImageUrl(product);
            
            return `
            <div class="product-card animate-on-scroll">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name || 'Product'}" 
                         onerror="this.onerror=null; this.src='assets/images/placeholder.jpg';">
                    ${product.stock > 0 ? '' : '<span class="out-of-stock">Out of Stock</span>'}
                </div>
                <div class="product-info">
                    <h3>${product.name || 'Unnamed'}</h3>
                    <p class="product-category">${product.category || 'General'}</p>
                    <p class="product-price">Ksh ${parseFloat(product.price || 0).toLocaleString()}</p>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})" ${product.stock > 0 ? '' : 'disabled'}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `}).join('');
        
        initScrollAnimations();
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="text-center">Failed to load products.</p>';
    }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Form validation
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            input.addEventListener('input', () => input.classList.remove('error'));
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Lazy loading
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
}