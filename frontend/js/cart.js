// Apiaro Constructors - Shopping Cart with M-Pesa Payment

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
    // Update cart count in navbar
    const cartCountElements = document.querySelectorAll('#cartCount');
    const count = getCartCount();
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
    
    // Update cart sidebar if open
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        const cart = getCart();
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <p>Your cart is empty</p>
                    <a href="products.html" class="btn btn-secondary" style="margin-top: 1rem;">Browse Products</a>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image ? 'http://localhost:5000/' + item.image : 'https://via.placeholder.com/80?text=No+Image'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">Ksh ${item.price.toLocaleString()}</p>
                        <div class="cart-item-quantity">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <span class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </span>
                </div>
            `).join('');
        }
        
        // Update total
        const totalElement = document.getElementById('cartTotal');
        if (totalElement) {
            totalElement.textContent = `Ksh ${getCartTotal().toLocaleString()}`;
        }
        
        // Update checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.onclick = showCheckoutForm;
        }
    }
}

function showCheckoutForm() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    const total = getCartTotal();
    
    // Create checkout modal
    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        ">
            <h2 style="margin-bottom: 1.5rem; color: #333;">Complete Your Order</h2>
            
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                <h3 style="margin-bottom: 0.5rem;">Order Summary</h3>
                <p><strong>Items:</strong> ${getCartCount()}</p>
                <p><strong>Total:</strong> Ksh ${total.toLocaleString()}</p>
            </div>
            
            <form id="checkoutForm">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Full Name *</label>
                    <input type="text" id="customerName" required style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 1rem;
                    ">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
                    <input type="email" id="customerEmail" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 1rem;
                    ">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">M-Pesa Phone Number *</label>
                    <input type="tel" id="customerPhone" placeholder="0712345678" required style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 1rem;
                    ">
                    <small style="color: #666; display: block; margin-top: 0.25rem;">
                        Format: 0712345678 or 254712345678
                    </small>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Delivery Address</label>
                    <textarea id="customerAddress" rows="2" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 1rem;
                        resize: vertical;
                    "></textarea>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Notes (Optional)</label>
                    <textarea id="orderNotes" rows="2" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        font-size: 1rem;
                        resize: vertical;
                    "></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="closeCheckoutModal()" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #ccc;
                        color: #333;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">Cancel</button>
                    
                    <button type="submit" id="placeOrderBtn" style="
                        flex: 1;
                        padding: 0.75rem;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 500;
                    ">Pay with M-Pesa</button>
                </div>
            </form>
            
            <div id="paymentStatus" style="display: none; margin-top: 1rem; padding: 1rem; border-radius: 8px; text-align: center;"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.remove();
    }
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();
    
    if (!name || !phone) {
        showNotification('Please fill in all required fields');
        return;
    }
    
    // Format phone number
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
        formattedPhone = '254' + phone.substring(1);
    } else if (!phone.startsWith('254')) {
        formattedPhone = '254' + phone;
    }
    
    // Build items array - CRITICAL FIX HERE
    const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
    }));
    
    const orderData = {
        customer_name: name,
        customer_email: email,
        customer_phone: formattedPhone,
        customer_address: address,
        items: items,
        notes: notes
    };
    
    console.log('Sending order data:', orderData);
    
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const paymentStatus = document.getElementById('paymentStatus');
    
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';
    
    try {
        const response = await api.createOrder(orderData);
        console.log('Response:', response);
        
        if (response.success) {
            paymentStatus.style.display = 'block';
            paymentStatus.style.background = '#e3f2fd';
            paymentStatus.style.color = '#1976d2';
            paymentStatus.innerHTML = `
                <i class="fas fa-mobile-alt" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">Check Your Phone!</h3>
                <p>${response.message}</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                    Enter your M-Pesa PIN to complete payment
                </p>
            `;
            
            pollPaymentStatus(response.order.id);
        } else {
            throw new Error(response.message || 'Order failed');
        }
    } catch (error) {
        console.error('Order error:', error);
        paymentStatus.style.display = 'block';
        paymentStatus.style.background = '#ffebee';
        paymentStatus.style.color = '#c62828';
        paymentStatus.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
            <p>${error.message}</p>
        `;
        
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Pay with M-Pesa';
    }
}

async function pollPaymentStatus(orderId, attempts = 0) {
    const maxAttempts = 30;
    const paymentStatus = document.getElementById('paymentStatus');
    
    if (attempts >= maxAttempts) {
        if (paymentStatus) {
            paymentStatus.innerHTML = `
                <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>Payment is taking longer than expected.</p>
                <p style="font-size: 0.9rem; color: #666;">
                    Check your M-Pesa messages. If you completed payment, we'll update your order shortly.
                </p>
            `;
        }
        return;
    }
    
    try {
        const response = await api.checkPaymentStatus(orderId);
        
        if (response.payment_status === 'completed') {
            clearCart();
            if (paymentStatus) {
                paymentStatus.style.background = '#e8f5e9';
                paymentStatus.style.color = '#2e7d32';
                paymentStatus.innerHTML = `
                    <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">Payment Successful!</h3>
                    <p>Receipt: ${response.mpesa_receipt_number}</p>
                    <p style="margin-top: 1rem;">
                        <a href="orders.html" style="
                            display: inline-block;
                            padding: 0.5rem 1rem;
                            background: #2e7d32;
                            color: white;
                            text-decoration: none;
                            border-radius: 4px;
                        ">View My Orders</a>
                    </p>
                `;
            }
            
            setTimeout(() => {
                closeCheckoutModal();
                window.location.href = 'orders.html';
            }, 3000);
            
        } else if (response.payment_status === 'failed') {
            if (paymentStatus) {
                paymentStatus.style.background = '#ffebee';
                paymentStatus.style.color = '#c62828';
                paymentStatus.innerHTML = `
                    <i class="fas fa-times-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">Payment Failed</h3>
                    <p>Please try again or use a different payment method.</p>
                    <button onclick="closeCheckoutModal()" style="
                        margin-top: 1rem;
                        padding: 0.5rem 1rem;
                        background: #c62828;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Close</button>
                `;
            }
        } else {
            setTimeout(() => pollPaymentStatus(orderId, attempts + 1), 5000);
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
        setTimeout(() => pollPaymentStatus(orderId, attempts + 1), 5000);
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

// Add animation styles
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
document.head.appendChild(style);

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', updateCartUI);