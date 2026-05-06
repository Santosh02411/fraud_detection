// Dashboard Module
class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
    }

    async initialize() {
        await this.loadDashboardData();
        this.initializeCharts();
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        try {
            showLoading(true);
            const data = await api.getDashboardStats();
            this.updateDashboardStats(data.summary);
            this.updateRecentTransactions(data.recent_transactions);
            this.updateCharts(data.daily_trends, data.category_breakdown);
        } catch (error) {
            showToast('Failed to load dashboard data', 'error');
            console.error('Dashboard error:', error);
        } finally {
            showLoading(false);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('total-transactions').textContent = stats.total_transactions.toLocaleString();
        document.getElementById('total-amount').textContent = `$${stats.total_amount.toFixed(2)}`;
        document.getElementById('fraud-transactions').textContent = stats.fraud_transactions.toLocaleString();
        document.getElementById('risk-score').textContent = `${stats.risk_score.toFixed(1)}%`;

        // Update risk score color
        const riskScoreElement = document.getElementById('risk-score');
        riskScoreElement.className = this.getRiskScoreClass(stats.risk_score);
    }

    getRiskScoreClass(score) {
        if (score < 20) return 'text-2xl font-bold text-green-400 mt-1';
        if (score < 40) return 'text-2xl font-bold text-yellow-400 mt-1';
        if (score < 60) return 'text-2xl font-bold text-orange-400 mt-1';
        return 'text-2xl font-bold text-red-400 mt-1';
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No recent transactions</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-credit-card text-blue-400"></i>
                    </div>
                    <div>
                        <p class="font-medium text-white">${transaction.merchant}</p>
                        <p class="text-sm text-gray-400">${new Date(transaction.timestamp).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-medium text-white">$${transaction.amount.toFixed(2)}</p>
                    <span class="status-${transaction.is_fraud ? 'fraud' : 'normal'}">
                        ${transaction.is_fraud ? 'Fraud' : 'Normal'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        this.initializeTransactionChart();
        this.initializeFraudChart();
    }

    initializeTransactionChart() {
        const ctx = document.getElementById('transaction-chart').getContext('2d');
        this.charts.transaction = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Transactions',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Amount',
                    data: [],
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: '#374151' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: '#9ca3af' },
                        grid: { color: '#374151' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: '#9ca3af' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    initializeFraudChart() {
        const ctx = document.getElementById('fraud-chart').getContext('2d');
        this.charts.fraud = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Fraud'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(239, 68, 68)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                }
            }
        });
    }

    updateCharts(dailyTrends, categoryBreakdown) {
        // Update transaction chart
        if (this.charts.transaction && dailyTrends.length > 0) {
            const labels = dailyTrends.map(d => new Date(d.date).toLocaleDateString());
            const transactionData = dailyTrends.map(d => d.transactions);
            const amountData = dailyTrends.map(d => d.amount);

            this.charts.transaction.data.labels = labels;
            this.charts.transaction.data.datasets[0].data = transactionData;
            this.charts.transaction.data.datasets[1].data = amountData;
            this.charts.transaction.update();
        }

        // Update fraud chart
        if (this.charts.fraud && dailyTrends.length > 0) {
            const totalTransactions = dailyTrends.reduce((sum, d) => sum + d.transactions, 0);
            const totalFraud = dailyTrends.reduce((sum, d) => sum + d.fraud_count, 0);
            const normalTransactions = totalTransactions - totalFraud;

            this.charts.fraud.data.datasets[0].data = [normalTransactions, totalFraud];
            this.charts.fraud.update();
        }
    }

    startAutoRefresh() {
        // Refresh dashboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Initialize dashboard manager
let dashboardManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}
