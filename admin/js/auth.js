// ============================================
// Apiaro Admin - Authentication Utilities
// ============================================
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

const BASE_URL = 'https://apiaro-constructors.onrender.com';
const API_URL = BASE_URL + '/api';

async function login(username, password) {
    try {
        console.log('🔐 Attempting login...');
        const response = await fetch(`${API_URL}/login`, {
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
        return { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        };
    }
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

// ============================================
// Smart fetch wrapper: auto-logout on 401
// ============================================
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