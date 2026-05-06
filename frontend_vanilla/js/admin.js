// Admin Module
class AdminManager {
    constructor() {
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.alertsPerPage = 10;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Event listeners will be added dynamically as needed
    }

    async initialize() {
        if (!api.isAdmin()) {
            showToast('Admin access required', 'error');
            navigateToPage('dashboard');
            return;
        }

        await this.loadAdminData();
    }

    async loadAdminData() {
        try {
            showLoading(true);
            
            // Load all admin data in parallel
            const [overview, users, alerts] = await Promise.all([
                api.getAdminOverview(),
                api.getAllUsers(1, this.usersPerPage),
                api.getAllAlerts(1, this.alertsPerPage, true) // Unresolved only
            ]);

            this.updateSystemStats(overview.system_stats);
            this.updateUsersList(users.users);
            this.updateSystemAlerts(overview.recent_alerts);
            
        } catch (error) {
            showToast('Failed to load admin data', 'error');
            console.error('Admin error:', error);
        } finally {
            showLoading(false);
        }
    }

    updateSystemStats(stats) {
        document.getElementById('admin-total-users').textContent = stats.total_users.toLocaleString();
        document.getElementById('admin-total-transactions').textContent = stats.total_transactions.toLocaleString();
        document.getElementById('admin-active-alerts').textContent = stats.unresolved_alerts.toLocaleString();
        document.getElementById('admin-fraud-rate').textContent = `${stats.fraud_rate.toFixed(2)}%`;
    }

    updateUsersList(users) {
        const container = document.getElementById('users-list');
        
        if (users.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No users found</p>';
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="data-table w-full">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Total Transactions</th>
                            <th>Fraud Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td class="font-medium">${user.username}</td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="px-2 py-1 rounded text-xs font-medium ${
                                        user.role === 'admin' 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-gray-600 text-gray-200'
                                    }">
                                        ${user.role}
                                    </span>
                                </td>
                                <td>${user.total_transactions.toLocaleString()}</td>
                                <td class="${this.getFraudRateClass(user.fraud_rate)}">
                                    ${user.fraud_rate.toFixed(2)}%
                                </td>
                                <td>
                                    <button onclick="adminManager.toggleUserRole(${user.id}, '${user.role}')" 
                                            class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
                                        ${user.role === 'admin' ? 'Demote' : 'Promote'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    updateSystemAlerts(alerts) {
        const container = document.getElementById('admin-alerts-list');
        
        if (alerts.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No active alerts</p>';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-${alert.alert_type} rounded-lg p-4 ${alert.resolved ? 'alert-resolved' : ''}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center space-x-2">
                                <p class="font-semibold text-white">${alert.username}</p>
                                <span class="text-xs px-2 py-1 rounded ${
                                    alert.alert_type === 'high_risk' ? 'bg-red-600' :
                                    alert.alert_type === 'suspicious' ? 'bg-yellow-600' :
                                    'bg-blue-600'
                                } text-white">
                                    ${alert.alert_type.replace('_', ' ').toUpperCase()}
                                </span>
                                ${alert.resolved ? '<span class="text-xs bg-green-600 text-white px-2 py-1 rounded">RESOLVED</span>' : ''}
                            </div>
                            <p class="text-gray-300 text-sm mt-1">${alert.message}</p>
                            <p class="text-gray-400 text-xs mt-1">
                                ${new Date(alert.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${alert.transaction ? `
                            <div class="text-right">
                                <p class="font-medium text-white">$${alert.transaction.amount.toFixed(2)}</p>
                                <p class="text-xs text-gray-400">${alert.transaction.merchant}</p>
                            </div>
                        ` : ''}
                        ${!alert.resolved ? `
                            <button onclick="adminManager.resolveAlert(${alert.id})" 
                                    class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-check mr-1"></i>Resolve
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getFraudRateClass(rate) {
        if (rate < 5) return 'text-green-400';
        if (rate < 15) return 'text-yellow-400';
        if (rate < 30) return 'text-orange-400';
        return 'text-red-400';
    }

    async toggleUserRole(userId, currentRole) {
        try {
            showLoading(true);
            await api.toggleUserRole(userId);
            showToast('User role updated successfully', 'success');
            
            // Reload admin data
            await this.loadAdminData();
        } catch (error) {
            showToast('Failed to update user role', 'error');
            console.error('Role toggle error:', error);
        } finally {
            showLoading(false);
        }
    }

    async resolveAlert(alertId) {
        try {
            showLoading(true);
            await api.adminResolveAlert(alertId);
            showToast('Alert resolved successfully', 'success');
            
            // Reload admin data
            await this.loadAdminData();
        } catch (error) {
            showToast('Failed to resolve alert', 'error');
            console.error('Alert resolution error:', error);
        } finally {
            showLoading(false);
        }
    }

    async loadMoreUsers() {
        this.currentPage++;
        try {
            const response = await api.getAllUsers(this.currentPage, this.usersPerPage);
            this.updateUsersList(response.users);
        } catch (error) {
            showToast('Failed to load more users', 'error');
        }
    }

    async loadMoreAlerts() {
        this.currentPage++;
        try {
            const response = await api.getAllAlerts(this.currentPage, this.alertsPerPage, true);
            this.updateSystemAlerts(response.alerts);
        } catch (error) {
            showToast('Failed to load more alerts', 'error');
        }
    }

    async refreshData() {
        this.currentPage = 1;
        await this.loadAdminData();
        showToast('Admin data refreshed', 'success');
    }
}

// Initialize admin manager
let adminManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
}
