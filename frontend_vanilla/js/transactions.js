// Transactions Module
class TransactionManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Transaction form
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit();
        });

        // Simulate button
        document.getElementById('simulate-btn').addEventListener('click', () => {
            this.handleSimulateTransaction();
        });
    }

    async handleTransactionSubmit() {
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const merchant = document.getElementById('transaction-merchant').value;
        const category = document.getElementById('transaction-category').value;
        const location = document.getElementById('transaction-location').value;

        if (!amount || !merchant || !category) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const transactionData = {
            amount,
            merchant,
            category,
            location,
            time: Math.floor(Date.now() / 1000) // Current time in seconds
        };

        await this.processTransaction(transactionData);
    }

    async handleSimulateTransaction() {
        showLoading(true);
        
        try {
            const response = await api.simulateTransaction();
            
            // Fill form with simulated data
            document.getElementById('transaction-amount').value = response.transaction_data.amount;
            document.getElementById('transaction-merchant').value = response.transaction_data.merchant;
            document.getElementById('transaction-category').value = response.transaction_data.category;
            document.getElementById('transaction-location').value = response.transaction_data.location;
            
            // Process the transaction
            await this.processTransaction(response.transaction_data);
        } catch (error) {
            showToast('Failed to simulate transaction', 'error');
        } finally {
            showLoading(false);
        }
    }

    async processTransaction(transactionData) {
        showLoading(true);

        try {
            const response = await api.predictTransaction(transactionData);
            this.displayPredictionResult(response);
            
            // Show appropriate message based on result
            if (response.fraud_prediction.fraud_probability > 80) {
                showToast('⚠️ High fraud risk detected!', 'error');
            } else if (response.fraud_prediction.fraud_probability > 50) {
                showToast('⚠️ Suspicious transaction detected', 'warning');
            } else {
                showToast('✅ Transaction appears safe', 'success');
            }
        } catch (error) {
            showToast('Failed to analyze transaction', 'error');
            console.error('Transaction error:', error);
        } finally {
            showLoading(false);
        }
    }

    displayPredictionResult(response) {
        const resultContainer = document.getElementById('prediction-result');
        const resultContent = document.getElementById('result-content');
        
        const prediction = response.fraud_prediction;
        const fraudProbability = prediction.fraud_probability;
        const isFraud = prediction.is_fraud;
        
        // Determine risk level and colors
        const riskLevel = this.getRiskLevel(fraudProbability);
        const riskColor = this.getRiskColor(fraudProbability);
        
        resultContent.innerHTML = `
            <div class="space-y-6">
                <!-- Fraud Probability -->
                <div class="text-center">
                    <div class="text-6xl font-bold mb-2 ${riskColor}">
                        ${fraudProbability.toFixed(1)}%
                    </div>
                    <p class="text-xl font-medium ${riskColor}">${riskLevel} Risk</p>
                    <p class="text-gray-400 mt-2">
                        ${isFraud ? '🚨 Transaction flagged as fraud' : '✅ Transaction appears legitimate'}
                    </p>
                </div>
                
                <!-- Probability Bar -->
                <div class="probability-bar">
                    <div class="probability-fill ${this.getProbabilityClass(fraudProbability)}" 
                         style="width: ${fraudProbability}%"></div>
                </div>
                
                <!-- Transaction Details -->
                <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="font-semibold text-white mb-3">Transaction Details</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Amount:</span>
                            <span class="font-medium">$${response.transaction_data?.amount || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Merchant:</span>
                            <span class="font-medium">${response.transaction_data?.merchant || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Category:</span>
                            <span class="font-medium">${response.transaction_data?.category || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Model Used:</span>
                            <span class="font-medium">${prediction.model_used}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Feature Importance -->
                ${response.feature_importance ? `
                <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="font-semibold text-white mb-3">Key Risk Factors</h4>
                    <div class="space-y-2">
                        ${Object.entries(response.feature_importance).slice(0, 5).map(([feature, importance]) => `
                            <div class="feature-importance">
                                <span class="text-sm text-gray-300 flex-1">${feature}</span>
                                <div class="feature-importance-bar">
                                    <div class="feature-importance-fill" style="width: ${(importance * 100).toFixed(1)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Alert Status -->
                ${response.alert_created ? `
                <div class="alert-high-risk rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                        <div>
                            <p class="font-semibold text-red-400">Fraud Alert Created</p>
                            <p class="text-sm text-gray-300">This transaction has been flagged for review</p>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Action Buttons -->
                <div class="flex space-x-4">
                    <button onclick="this.closest('#prediction-result').classList.add('hidden'); document.getElementById('transaction-form').reset();" 
                            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>New Transaction
                    </button>
                    <button onclick="window.location.href='#alerts'" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        <i class="fas fa-bell mr-2"></i>View Alerts
                    </button>
                </div>
            </div>
        `;
        
        resultContainer.classList.remove('hidden');
        
        // Add animation
        resultContainer.style.animation = 'fadeIn 0.5s ease-out';
    }

    getRiskLevel(probability) {
        if (probability < 20) return 'Very Low';
        if (probability < 40) return 'Low';
        if (probability < 60) return 'Medium';
        if (probability < 80) return 'High';
        return 'Critical';
    }

    getRiskColor(probability) {
        if (probability < 20) return 'text-green-400';
        if (probability < 40) return 'text-yellow-400';
        if (probability < 60) return 'text-orange-400';
        if (probability < 80) return 'text-red-400';
        return 'text-red-600';
    }

    getProbabilityClass(probability) {
        if (probability < 20) return 'probability-low';
        if (probability < 40) return 'probability-low';
        if (probability < 60) return 'probability-medium';
        if (probability < 80) return 'probability-high';
        return 'probability-critical';
    }
}

// Initialize transaction manager
const transactionManager = new TransactionManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionManager;
}
