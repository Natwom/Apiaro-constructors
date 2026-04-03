// Apiaro Admin - Authentication

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

async function login(username, password) {
    try {
        console.log('🔐 Attempting login...');
        
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('📥 Login response:', data);
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed');
        }
        
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        console.log('✅ Token stored:', data.access_token.substring(0, 30) + '...');
        
        return data;
    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
}

function getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        console.log('⚠️ No token in localStorage');
        return null;
    }
    return token;
}

function getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function isAuthenticated() {
    return !!getToken();
}

function getAuthHeaders() {
    const token = getToken();
    if (!token) {
        console.error('❌ No token available for request');
        return { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        };
    }
    
    console.log('🔑 Using token:', token.substring(0, 30) + '...');
    
    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

async function checkAuth() {
    const token = getToken();
    
    if (!token) {
        console.log('🚫 No token, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    
    console.log('✅ Authenticated with token');
    
    const user = getUser();
    if (user) {
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = user.full_name || user.username;
        }
    }
    
    return true;
}

async function apiFetch(url, options = {}) {
    const headers = getAuthHeaders();
    
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    console.log('📤 API Request:', url);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });
    
    if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Token invalid or expired');
        logout();
        throw new Error('Session expired. Please login again.');
    }
    
    return response;
}

// ==================== API METHODS ====================

async function getMessages() {
    const response = await apiFetch('http://localhost:5000/api/messages');
    const data = await response.json();
    return data.messages || data;
}

async function getMessage(id) {
    const response = await apiFetch(`http://localhost:5000/api/messages/${id}`);
    const data = await response.json();
    return data.message || data;
}

async function markMessageAsRead(id) {
    const response = await apiFetch(`http://localhost:5000/api/messages/${id}/read`, {
        method: 'PUT'
    });
    return response.json();
}

async function deleteMessage(id) {
    const response = await apiFetch(`http://localhost:5000/api/messages/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

async function getProjects() {
    const response = await apiFetch('http://localhost:5000/api/projects');
    const data = await response.json();
    return data.projects || data;
}

async function createProject(formData) {
    const response = await apiFetch('http://localhost:5000/api/projects', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

async function updateProject(id, formData) {
    const response = await apiFetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'PUT',
        body: formData
    });
    return response.json();
}

async function deleteProject(id) {
    const response = await apiFetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

async function getProducts() {
    const response = await apiFetch('http://localhost:5000/api/products');
    const data = await response.json();
    return data.products || data;
}

async function createProduct(formData) {
    const response = await apiFetch('http://localhost:5000/api/products', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

async function updateProduct(id, formData) {
    const response = await apiFetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        body: formData
    });
    return response.json();
}

async function deleteProduct(id) {
    const response = await apiFetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

async function getOrders() {
    const response = await apiFetch('http://localhost:5000/api/orders');
    const data = await response.json();
    return data.orders || data;
}

async function updateOrderStatus(id, status) {
    const response = await apiFetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    return response.json();
}

async function deleteOrder(id) {
    const response = await apiFetch(`http://localhost:5000/api/orders/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

async function getDashboardStats() {
    const [projects, products, messages, orders] = await Promise.all([
        getProjects(),
        getProducts(),
        getMessages(),
        getOrders()
    ]);

    return {
        totalProjects: projects.length,
        totalProducts: products.length,
        totalMessages: messages.length,
        unreadMessages: messages.filter(m => !m.is_read).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        recentOrders: orders.slice(0, 5)
    };
}

// Expose API globally
window.api = {
    getMessages,
    getMessage,
    markMessageAsRead,
    deleteMessage,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    updateOrderStatus,
    deleteOrder,
    getDashboardStats
};