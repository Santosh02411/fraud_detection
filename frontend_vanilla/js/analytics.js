// Analytics Module
class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.currentPage = 1;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Export buttons
        document.getElementById('export-transactions').addEventListener('click', () => {
            this.exportData('transactions');
        });

        document.getElementById('export-alerts').addEventListener('click', () => {
            this.exportData('alerts');
        });
    }

    async initialize() {
        await this.loadAnalyticsData();
        this.initializeCharts();
    }

    async loadAnalyticsData() {
        try {
            showLoading(true);
            
            // Load all analytics data in parallel
            const [fraudTrends, merchantAnalysis] = await Promise.all([
                api.getFraudTrends(),
                api.getMerchantAnalysis()
            ]);

            this.updateFraudTrendsChart(fraudTrends.hourly_patterns);
            this.updateDistributionChart(fraudTrends.probability_distribution);
            this.updateMerchantAnalysis(merchantAnalysis.top_merchants, merchantAnalysis.risky_merchants);
            
        } catch (error) {
            showToast('Failed to load analytics data', 'error');
            console.error('Analytics error:', error);
        } finally {
            showLoading(false);
        }
    }

    initializeCharts() {
        this.initializeHourlyChart();
        this.initializeDistributionChart();
    }

    initializeHourlyChart() {
        const ctx = document.getElementById('hourly-chart').getContext('2d');
        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Total Transactions',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }, {
                    label: 'Fraud Transactions',
                    data: [],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1
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
                        ticks: { color: '#9ca3af' },
                        grid: { color: '#374151' }
                    }
                }
            }
        });
    }

    initializeDistributionChart() {
        const ctx = document.getElementById('distribution-chart').getContext('2d');
        this.charts.distribution = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(220, 38, 38, 0.8)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(59, 130, 246)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                        'rgb(220, 38, 38)'
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

    updateFraudTrendsChart(hourlyPatterns) {
        if (!this.charts.hourly) return;

        const hours = Array.from({length: 24}, (_, i) => i);
        const totalTransactions = new Array(24).fill(0);
        const fraudTransactions = new Array(24).fill(0);

        // Process hourly data
        hourlyPatterns.forEach(pattern => {
            const hour = pattern.hour;
            if (hour >= 0 && hour < 24) {
                totalTransactions[hour] = pattern.total_transactions;
                fraudTransactions[hour] = pattern.fraud_transactions;
            }
        });

        this.charts.hourly.data.datasets[0].data = totalTransactions;
        this.charts.hourly.data.datasets[1].data = fraudTransactions;
        this.charts.hourly.update();
    }

    updateDistributionChart(distribution) {
        if (!this.charts.distribution) return;

        const labels = distribution.map(d => d.range);
        const data = distribution.map(d => d.count);

        this.charts.distribution.data.labels = labels;
        this.charts.distribution.data.datasets[0].data = data;
        this.charts.distribution.update();
    }

    updateMerchantAnalysis(topMerchants, riskyMerchants) {
        const container = document.getElementById('merchant-analysis');
        
        // Combine and display merchant data
        const merchantData = [
            ...topMerchants.slice(0, 6).map(m => ({...m, type: 'top'})),
            ...riskyMerchants.slice(0, 3).map(m => ({...m, type: 'risky'}))
        ];

        container.innerHTML = merchantData.map(merchant => {
            const riskClass = this.getRiskClass(merchant.fraud_rate);
            const riskColor = this.getRiskColor(merchant.fraud_rate);
            
            return `
                <div class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-white truncate">${merchant.merchant}</h4>
                        ${merchant.type === 'risky' ? '<span class="bg-red-600 text-white text-xs px-2 py-1 rounded">Risky</span>' : ''}
                    </div>
                    <div class="space-y-1 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Transactions:</span>
                            <span class="font-medium">${merchant.transaction_count}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Total Amount:</span>
                            <span class="font-medium">$${merchant.total_amount.toFixed(0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Fraud Rate:</span>
                            <span class="font-medium ${riskColor}">${merchant.fraud_rate.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="probability-bar">
                            <div class="probability-fill ${this.getProbabilityClass(merchant.fraud_rate)}" 
                                 style="width: ${Math.min(merchant.fraud_rate, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getRiskClass(rate) {
        if (rate < 5) return 'risk-low';
        if (rate < 15) return 'risk-medium';
        if (rate < 30) return 'risk-high';
        return 'risk-critical';
    }

    getRiskColor(rate) {
        if (rate < 5) return 'text-green-400';
        if (rate < 15) return 'text-yellow-400';
        if (rate < 30) return 'text-orange-400';
        return 'text-red-400';
    }

    getProbabilityClass(rate) {
        if (rate < 5) return 'probability-low';
        if (rate < 15) return 'probability-medium';
        if (rate < 30) return 'probability-high';
        return 'probability-critical';
    }

    async exportData(type) {
        try {
            showLoading(true);
            const data = await api.exportData(type);
            
            // Create downloadable file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`, 'success');
        } catch (error) {
            showToast('Failed to export data', 'error');
            console.error('Export error:', error);
        } finally {
            showLoading(false);
        }
    }

    destroy() {
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Initialize analytics manager
let analyticsManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}
