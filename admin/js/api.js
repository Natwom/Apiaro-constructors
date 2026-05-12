// ============================================
// Apiaro Admin API Client
// ============================================
const BASE_URL = 'https://apiaro-constructors.onrender.com';
const API_BASE_URL = BASE_URL + '/api';
const UPLOADS_BASE_URL = BASE_URL + '/uploads';

const api = {
    getToken() {
        return localStorage.getItem('admin_token');
    },

    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    getImageUrl(imagePath) {
        if (!imagePath || imagePath === 'undefined' || imagePath === 'null' || imagePath === '') {
            return '../assets/images/placeholder.jpg';
        }
        
        let path = String(imagePath).trim();
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        if (path.startsWith('/uploads/')) {
            return `${BASE_URL}${path}`;
        }
        if (path.startsWith('uploads/')) {
            return `${BASE_URL}/${path}`;
        }
        if (!path.includes('/')) {
            return `${BASE_URL}/uploads/products/${path}`;
        }
        return `${UPLOADS_BASE_URL}/${path}`;
    },

    // ============================================
    // Auth utilities (mirrored from auth.js)
    // ============================================
    async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            const data = await this.handleResponse(response);
            if (data.access_token) {
                localStorage.setItem('admin_token', data.access_token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
    },

    getUser() {
        const user = localStorage.getItem('admin_user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async checkAuth() {
        const token = this.getToken();
        if (!token) {
            window.location.href = 'login.html';
            return false;
        }
        const user = this.getUser();
        if (user) {
            const el = document.getElementById('username');
            if (el) el.textContent = user.full_name || user.username;
        }
        return true;
    },

    // ============================================
    // Smart fetch with 401 handling
    // ============================================
    async apiFetch(url, options = {}) {
        const headers = this.getAuthHeaders();
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }
        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...(options.headers || {}) }
        });
        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired. Please login again.');
        }
        return response;
    },

    // ============================================
    // Projects
    // ============================================
    async getProjects() {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: this.getAuthHeaders()
            });
            const data = await this.handleResponse(response);
            return (data.projects || []).map(p => {
                let imagesArray = [];
                if (p.images) {
                    try {
                        imagesArray = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                    } catch (e) { imagesArray = []; }
                }
                const firstImage = p.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
                return {
                    ...p,
                    image_url: this.getImageUrl(firstImage),
                    images: imagesArray.map(img => this.getImageUrl(img))
                };
            });
        } catch (error) {
            console.error('Get projects error:', error);
            return [];
        }
    },

    async getProject(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
                headers: this.getAuthHeaders()
            });
            const data = await this.handleResponse(response);
            const project = data.project;
            if (project) {
                let imagesArray = [];
                if (project.images) {
                    try {
                        imagesArray = typeof project.images === 'string' ? JSON.parse(project.images) : project.images;
                    } catch (e) { imagesArray = []; }
                }
                const firstImage = project.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
                project.image_url = this.getImageUrl(firstImage);
                project.images = imagesArray.map(img => this.getImageUrl(img));
            }
            return project;
        } catch (error) {
            console.error('Get project error:', error);
            throw error;
        }
    },

    async createProject(formData) {
        const response = await this.apiFetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            body: formData
        });
        return this.handleResponse(response);
    },

    async updateProject(id, formData) {
        const response = await this.apiFetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'PUT',
            body: formData
        });
        return this.handleResponse(response);
    },

    async deleteProject(id) {
        const response = await this.apiFetch(`${API_BASE_URL}/projects/${id}`, {
            method: 'DELETE'
        });
        return this.handleResponse(response);
    },

    // ============================================
    // Products
    // ============================================
    async getProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                headers: this.getAuthHeaders()
            });
            const data = await this.handleResponse(response);
            return (data.products || []).map(p => {
                let imagesArray = [];
                if (p.images) {
                    try {
                        imagesArray = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                    } catch (e) { imagesArray = []; }
                }
                const firstImage = p.image_url || (imagesArray.length > 0 ? imagesArray[0] : null);
                return {
                    ...p,
                    image: this.getImageUrl(firstImage),
                    image_url: this.getImageUrl(firstImage),
                    images: imagesArray.map(img => this.getImageUrl(img))
                };
            });
        } catch (error) {
            console.error('Get products error:', error);
            return [];
        }
    },

    async getProduct(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                headers: this.getAuthHeaders()
            });
            const data = await this.handleResponse(response);
            const product = data.product;
            if (product) {
                let imagesArray = [];
                if (product.images) {
                    try {
                        imagesArray = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                    } catch (e) { imagesArray = []; }
                }
                const firstImage = product.image_url || (imagesArray.length > 0 ? imagesArray[0] : null);
                product.image = this.getImageUrl(firstImage);
                product.image_url = this.getImageUrl(firstImage);
                product.images = imagesArray.map(img => this.getImageUrl(img));
            }
            return product;
        } catch (error) {
            console.error('Get product error:', error);
            throw error;
        }
    },

    async createProduct(formData) {
        const response = await this.apiFetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            body: formData
        });
        return this.handleResponse(response);
    },

    async updateProduct(id, formData) {
        const response = await this.apiFetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            body: formData
        });
        return this.handleResponse(response);
    },

    async deleteProduct(id) {
        const response = await this.apiFetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });
        return this.handleResponse(response);
    },

    // ============================================
    // Messages
    // ============================================
    async getMessages() {
        try {
            const response = await fetch(`${API_BASE_URL}/messages`, {
                headers: this.getAuthHeaders()
            });
            const data = await this.handleResponse(response);
            return data.messages || [];
        } catch (error) {
            console.error('Get messages error:', error);
            return [];
        }
    },

    async markMessageAsRead(id) {
        const response = await this.apiFetch(`${API_BASE_URL}/messages/${id}/read`, {
            method: 'PUT'
        });
        return this.handleResponse(response);
    },

    async deleteMessage(id) {
        const response = await this.apiFetch(`${API_BASE_URL}/messages/${id}`, {
            method: 'DELETE'
        });
        return this.handleResponse(response);
    },

    // ============================================
    // Orders
    // ============================================
    async getOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: this.getAuthHeaders()
            });
            const data = await this.handleResponse(response);
            return data.orders || [];
        } catch (error) {
            console.error('Get orders error:', error);
            return [];
        }
    },

    async updateOrderStatus(id, status) {
        const response = await this.apiFetch(`${API_BASE_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return this.handleResponse(response);
    },

    async deleteOrder(id) {
        const response = await this.apiFetch(`${API_BASE_URL}/orders/${id}`, {
            method: 'DELETE'
        });
        return this.handleResponse(response);
    },

    // ============================================
    // Dashboard
    // ============================================
    async getDashboardStats() {
        try {
            const [projects, products, messages, orders] = await Promise.all([
                this.getProjects(),
                this.getProducts(),
                this.getMessages(),
                this.getOrders()
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
        } catch (error) {
            console.error('Dashboard stats error:', error);
            throw error;
        }
    },

    // ============================================
    // Response handler
    // ============================================
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
        }
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        return data;
    }
};

window.api = api;