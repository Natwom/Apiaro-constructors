/**
 * Apiaro Constructors - Shopping Cart Module
 * ============================================
 * Handles cart operations: add, remove, update quantity, and UI rendering.
 * Integrates with api.js for image URL resolution.
 */

const CART_KEY = 'apiaro_cart';

// ============================================
// Core Cart Operations
// ============================================

/**
 * Retrieve cart from localStorage
 * @returns {Array} Cart items array
 */
function getCart() {
    try {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        console.error('Error reading cart:', e);
        return [];
    }
}

/**
 * Save cart to localStorage and update UI
 * @param {Array} cart - Cart items array
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartUI();
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

/**
 * Add item to cart
 * @param {string|number} id - Product ID
 * @param {string} name - Product name
 * @param {number} price - Product price
 * @param {string} image - Product image path/URL
 */
function addToCart(id, name, price, image) {
    const cart = getCart();
    const existingItem = cart.find(item => String(item.id) === String(id));
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: String(id),
            name: name || 'Unknown Product',
            price: parseFloat(price) || 0,
            image: image || '',
            quantity: 1
        });
    }
    
    saveCart(cart);
    showNotification(`${name} added to cart`);
}

/**
 * Remove item from cart by ID
 * @param {string|number} id - Product ID to remove
 */
function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(id));
    saveCart(cart);
    showNotification('Item removed from cart');
}

/**
 * Update item quantity
 * @param {string|number} id - Product ID
 * @param {number} change - Amount to change (+1 or -1)
 */
function updateQuantity(id, change) {
    const cart = getCart();
    const item = cart.find(item => String(item.id) === String(id));
    
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }
    
    saveCart(cart);
}

/**
 * Clear entire cart
 */
function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartUI();
    showNotification('Cart cleared');
}

// ============================================
// Cart Calculations
// ============================================

/**
 * Calculate cart total price
 * @returns {number} Total price
 */
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Calculate total item count
 * @returns {number} Total quantity of all items
 */
function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// ============================================
// UI Updates
// ============================================

/**
 * Update all cart count badges across the site
 */
function updateCartUI() {
    const cartCountElements = document.querySelectorAll('#cartCount');
    const count = getCartCount();
    
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
    
    renderCartPage();
}

/**
 * Render the full cart page (cart.html)
 */
function renderCartPage() {
    const container = document.getElementById('cartPageItems');
    const summaryContainer = document.getElementById('cartPageSummary');
    
    if (!container) return;
    
    const cart = getCart();
    
    // Empty cart state
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-page">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #ddd; margin-bottom: 1.5rem; display: block;"></i>
                <h3>Your cart is empty</h3>
                <p>Browse our construction materials and add items to your cart.</p>
                <a href="products.html" class="btn btn-primary" style="margin-top: 1.5rem;">
                    <i class="fas fa-arrow-left"></i> Browse Products
                </a>
            </div>
        `;
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="summary-row total">
                    <span>Subtotal</span>
                    <span>Ksh 0</span>
                </div>
                <button class="btn btn-primary btn-block" disabled style="margin-top:1rem; opacity: 0.5;">
                    Proceed to Checkout
                </button>
            `;
        }
        return;
    }
    
    // Render cart items
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        const imageUrl = item.image ? api.getImageUrl(item.image) : 'https://via.placeholder.com/120?text=No+Image';
        
        return `
            <div class="cart-page-item" data-id="${item.id}">
                <div class="cart-page-item-image">
                    <img src="${imageUrl}" alt="${escapeHtml(item.name)}" loading="lazy">
                </div>
                <div class="cart-page-item-details">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p class="cart-page-item-price">Ksh ${item.price.toLocaleString()} <small>per unit</small></p>
                    <div class="cart-page-item-actions">
                        <div class="cart-page-qty">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)" aria-label="Decrease quantity">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)" aria-label="Increase quantity">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart('${item.id}')" aria-label="Remove item">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div class="cart-page-item-total">
                    Ksh ${itemTotal.toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
    
    // Render order summary
    if (summaryContainer) {
        const total = getCartTotal();
        const count = getCartCount();
        const deliveryFee = 0; // Calculated at checkout
        const grandTotal = total + deliveryFee;
        
        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Items (${count})</span>
                <span>Ksh ${total.toLocaleString()}</span>
            </div>
            <div class="summary-row">
                <span>Delivery Fee</span>
                <span>Calculated at checkout</span>
            </div>
            <div class="summary-row">
                <span>Tax</span>
                <span>Included</span>
            </div>
            <div class="summary-row total">
                <span>Subtotal</span>
                <span>Ksh ${grandTotal.toLocaleString()}</span>
            </div>
            <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:1rem;">
                Proceed to Checkout <i class="fas fa-arrow-right"></i>
            </a>
            <a href="products.html" class="btn btn-outline btn-block" style="margin-top:0.5rem;">
                <i class="fas fa-shopping-bag"></i> Continue Shopping
            </a>
            <button onclick="clearCart()" class="btn btn-secondary btn-block" style="margin-top:0.5rem; background: transparent; color: var(--error-color); border: 1px solid var(--error-color);">
                <i class="fas fa-trash-alt"></i> Clear Cart
            </button>
        `;
    }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success', 'error', 'info'
 */
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();
    
    const colors = {
        success: 'var(--success-color, #10b981)',
        error: 'var(--error-color, #ef4444)',
        info: 'var(--primary-color, #1e3a8a)'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius, 8px);
        box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1));
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 350px;
    `;
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.success}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// CSS Animations (injected once)
// ============================================

(function injectNotificationStyles() {
    if (document.getElementById('cart-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'cart-notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});