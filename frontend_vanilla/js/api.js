// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.access_token) {
            this.token = data.access_token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    }

    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        if (data.access_token) {
            this.token = data.access_token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // Transaction methods
    async predictTransaction(transactionData) {
        return await this.request('/transactions/predict', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    async getTransactionHistory(page = 1, perPage = 10) {
        return await this.request(`/transactions/history?page=${page}&per_page=${perPage}`);
    }

    async simulateTransaction() {
        return await this.request('/transactions/simulate', {
            method: 'POST'
        });
    }

    async getAlerts(page = 1, perPage = 10) {
        return await this.request(`/transactions/alerts?page=${page}&per_page=${perPage}`);
    }

    async resolveAlert(alertId) {
        return await this.request(`/transactions/alerts/${alertId}/resolve`, {
            method: 'PUT'
        });
    }

    // Analytics methods
    async getDashboardStats(days = 30) {
        return await this.request(`/analytics/dashboard?days=${days}`);
    }

    async getFraudTrends(days = 30) {
        return await this.request(`/analytics/fraud-trends?days=${days}`);
    }

    async getMerchantAnalysis(days = 30) {
        return await this.request(`/analytics/merchant-analysis?days=${days}`);
    }

    async exportData(type = 'transactions', days = 30) {
        return await this.request(`/analytics/export?type=${type}&days=${days}`);
    }

    // Admin methods
    async getAdminOverview(days = 30) {
        return await this.request(`/admin/overview?days=${days}`);
    }

    async getAllUsers(page = 1, perPage = 20) {
        return await this.request(`/admin/users?page=${page}&per_page=${perPage}`);
    }

    async getAllTransactions(page = 1, perPage = 20, fraudOnly = false) {
        return await this.request(`/admin/transactions?page=${page}&per_page=${perPage}&fraud_only=${fraudOnly}`);
    }

    async getAllAlerts(page = 1, perPage = 20, unresolvedOnly = false) {
        return await this.request(`/admin/alerts?page=${page}&per_page=${perPage}&unresolved_only=${unresolvedOnly}`);
    }

    async adminResolveAlert(alertId) {
        return await this.request(`/admin/alerts/${alertId}/resolve`, {
            method: 'PUT'
        });
    }

    async toggleUserRole(userId) {
        return await this.request(`/admin/users/${userId}/toggle-role`, {
            method: 'PUT'
        });
    }

    async getSystemHealth() {
        return await this.request('/admin/system-health');
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
}

// Create global API instance
const api = new ApiService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
