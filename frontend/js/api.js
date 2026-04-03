const API_BASE_URL = 'http://localhost:5000/api';
const UPLOADS_BASE_URL = 'http://localhost:5000/uploads';

const api = {
    getImageUrl(imagePath) {
        if (!imagePath || imagePath === 'undefined' || imagePath === 'null' || imagePath === '') {
            return 'https://via.placeholder.com/300x300?text=No+Image';
        }
        
        let path = String(imagePath).trim();
        
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
        if (path.startsWith('/uploads/')) {
            return `http://localhost:5000${path}`;
        }
        
        if (path.startsWith('uploads/')) {
            return `http://localhost:5000/${path}`;
        }
        
        if (!path.includes('/')) {
            return `http://localhost:5000/uploads/products/${path}`;
        }
        
        return `${UPLOADS_BASE_URL}/${path}`;
    },

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
            return this.handleResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async getProjects(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${API_BASE_URL}/projects${queryParams ? '?' + queryParams : ''}`;
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.error('Failed to fetch projects:', response.status);
                return [];
            }
            
            const data = await this.handleResponse(response);
            
            const projects = (data.projects || []).map(p => {
                let imagesArray = [];
                if (p.images) {
                    try {
                        imagesArray = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                    } catch (e) {
                        imagesArray = [];
                    }
                }
                
                if (!Array.isArray(imagesArray)) {
                    imagesArray = [];
                }
                
                const rawImage = p.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
                
                return {
                    ...p,
                    image_url: this.getImageUrl(rawImage),
                    images: imagesArray.map(img => this.getImageUrl(img))
                };
            });
            
            return projects;
        } catch (error) {
            console.error('Fetch Error:', error);
            return [];
        }
    },

    async getProject(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await this.handleResponse(response);
            const project = data.project || data;
            
            let imagesArray = [];
            if (project.images) {
                try {
                    imagesArray = typeof project.images === 'string' ? JSON.parse(project.images) : project.images;
                } catch (e) {
                    imagesArray = [];
                }
            }
            
            const rawImage = project.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
            
            return {
                ...project,
                image_url: this.getImageUrl(rawImage),
                images: imagesArray.map(img => this.getImageUrl(img))
            };
        } catch (error) {
            console.error('Get project error:', error);
            throw error;
        }
    },

    async getProducts(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${API_BASE_URL}/products${queryParams ? '?' + queryParams : ''}`;
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                console.error('Failed to fetch products:', response.status);
                return [];
            }
            
            const data = await this.handleResponse(response);
            
            const products = (data.products || []).map(p => {
                let imagesArray = [];
                if (p.images) {
                    try {
                        imagesArray = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                    } catch (e) {
                        imagesArray = [];
                    }
                }
                
                if (!Array.isArray(imagesArray)) {
                    imagesArray = [];
                }
                
                const rawImage = p.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
                
                return {
                    ...p,
                    image_url: this.getImageUrl(rawImage),
                    images: imagesArray.map(img => this.getImageUrl(img))
                };
            });
            
            return products;
        } catch (error) {
            console.error('Fetch Error:', error);
            return [];
        }
    },

    async getProduct(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await this.handleResponse(response);
            const product = data.product || data;
            
            let imagesArray = [];
            if (product.images) {
                try {
                    imagesArray = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                } catch (e) {
                    imagesArray = [];
                }
            }
            
            const rawImage = product.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
            
            return {
                ...product,
                image_url: this.getImageUrl(rawImage),
                images: imagesArray.map(img => this.getImageUrl(img))
            };
        } catch (error) {
            console.error('Get product error:', error);
            throw error;
        }
    },

    async getMessages(token, filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE_URL}/messages?${queryParams}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await this.handleResponse(response);
            return data.messages || [];
        } catch (error) {
            console.error('Get messages error:', error);
            throw error;
        }
    },

    async sendMessage(messageData) {
        try {
            const response = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    },

    async markMessageAsRead(id, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${id}/read`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Mark message read error:', error);
            throw error;
        }
    },

    async deleteMessage(id, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Delete message error:', error);
            throw error;
        }
    },

    async getOrders(token, filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await this.handleResponse(response);
            return data.orders || [];
        } catch (error) {
            console.error('Get orders error:', error);
            throw error;
        }
    },

    async createOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Create order error:', error);
            throw error;
        }
    },

    async checkPaymentStatus(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
                headers: { 
                    'Accept': 'application/json'
                }
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Check payment status error:', error);
            throw error;
        }
    },

    async updateOrderStatus(id, status, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Update order status error:', error);
            throw error;
        }
    },

    async deleteOrder(id, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Delete order error:', error);
            throw error;
        }
    },

    async getDashboardStats(token) {
        try {
            const [projects, products, messages, orders] = await Promise.all([
                this.getProjects(),
                this.getProducts(),
                this.getMessages(token),
                this.getOrders(token)
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