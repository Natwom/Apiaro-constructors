// Apiaro Constructors - Shopping Cart Core

const CART_KEY = 'apiaro_cart';

function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
}

function addToCart(id, name, price, image) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            price: parseFloat(price),
            image,
            quantity: 1
        });
    }
    
    saveCart(cart);
    showNotification(`${name} added to cart`);
}

function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    updateCartUI();
}

function updateQuantity(id, change) {
    const cart = getCart();
    const item = cart.find(item => item.id === id);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
        saveCart(cart);
        updateCartUI();
    }
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartUI();
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartUI() {
    const cartCountElements = document.querySelectorAll('#cartCount');
    const count = getCartCount();
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
    
    renderCartPage();
}

function renderCartPage() {
    const container = document.getElementById('cartPageItems');
    const summaryContainer = document.getElementById('cartPageSummary');
    if (!container) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-page">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added any construction materials yet.</p>
                <a href="products.html" class="btn btn-primary" style="margin-top: 1rem;">Browse Products</a>
            </div>
        `;
        if (summaryContainer) summaryContainer.innerHTML = '';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-page-item">
            <div class="cart-page-item-image">
                <img src="${item.image ? api.getImageUrl(item.image) : 'https://via.placeholder.com/120?text=No+Image'}" alt="${item.name}">
            </div>
            <div class="cart-page-item-details">
                <h4>${item.name}</h4>
                <p class="cart-page-item-price">Ksh ${item.price.toLocaleString()} <small>per unit</small></p>
                <div class="cart-page-item-actions">
                    <div class="cart-page-qty">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <span class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Remove
                    </span>
                </div>
            </div>
            <div class="cart-page-item-total">
                <span>Ksh ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
    
    if (summaryContainer) {
        const total = getCartTotal();
        const count = getCartCount();
        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Items (${count})</span>
                <span>Ksh ${total.toLocaleString()}</span>
            </div>
            <div class="summary-row">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
            </div>
            <div class="summary-row total">
                <span>Subtotal</span>
                <span>Ksh ${total.toLocaleString()}</span>
            </div>
            <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:1rem;">Proceed to Checkout</a>
            <a href="products.html" class="btn btn-outline btn-block" style="margin-top:0.5rem;">Continue Shopping</a>
        `;
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--success-color, #28a745);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
if (!document.getElementById('cart-notification-styles')) {
    style.id = 'cart-notification-styles';
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', updateCartUI);