const API_BASE_URL = 'http://localhost:5000/api';
const UPLOADS_BASE_URL = 'http://localhost:5000/uploads';

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async verifyToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Verify token error:', error);
            throw error;
        }
    },

    async getProjects() {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: this.getAuthHeaders()
            });
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
                
                const firstImage = p.image_url || (imagesArray.length > 0 ? imagesArray[0] : '');
                
                return {
                    ...p,
                    image_url: this.getImageUrl(firstImage),
                    images: imagesArray.map(img => this.getImageUrl(img))
                };
            });
            
            return projects;
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
                    } catch (e) {
                        imagesArray = [];
                    }
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
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: formData
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Create project error:', error);
            throw error;
        }
    },

    async updateProject(id, formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: formData
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Update project error:', error);
            throw error;
        }
    },

    async deleteProject(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Delete project error:', error);
            throw error;
        }
    },

    async getProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                headers: this.getAuthHeaders()
            });
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
                
                const firstImage = p.image_url || (imagesArray.length > 0 ? imagesArray[0] : null);
                
                return {
                    ...p,
                    image: this.getImageUrl(firstImage),
                    image_url: this.getImageUrl(firstImage),
                    images: imagesArray.map(img => this.getImageUrl(img))
                };
            });
            
            return products;
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
                    } catch (e) {
                        imagesArray = [];
                    }
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
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: formData
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Create product error:', error);
            throw error;
        }
    },

    async updateProduct(id, formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: formData
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    },

    async deleteProduct(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    },

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
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${id}/read`, {
                method: 'PUT',
                headers: this.getAuthHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Mark message read error:', error);
            throw error;
        }
    },

    async deleteMessage(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Delete message error:', error);
            throw error;
        }
    },

    // FIXED: getOrders - no token parameter needed, uses getAuthHeaders()
    async getOrders() {
        try {
            console.log('Fetching orders...');
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: {
                    ...this.getAuthHeaders(),
                    'Accept': 'application/json'
                }
            });
            
            console.log('Orders response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Orders data:', data);
            
            if (data.success === false) {
                throw new Error(data.message || 'Failed to load orders');
            }
            
            return data.orders || [];
        } catch (error) {
            console.error('Get orders error:', error);
            throw error;
        }
    },

    // FIXED: updateOrderStatus - no token parameter needed
    async updateOrderStatus(id, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Update order status error:', error);
            throw error;
        }
    },

    async deleteOrder(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('Delete order error:', error);
            throw error;
        }
    },

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
                pendingOrders: orders.filter(o => o.status === 'pending').length
            };
        } catch (error) {
            console.error('Dashboard stats error:', error);
            throw error;
        }
    },

    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        
        return data;
    }
};