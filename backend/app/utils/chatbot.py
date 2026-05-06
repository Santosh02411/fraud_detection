import random

class FraudAssistant:
    def __init__(self):
        self.context = {}
        
    def get_response(self, query, system_stats=None):
        """Generate a response based on the query and current system stats"""
        query = query.lower()
        
        if "status" in query or "performance" in query:
            if system_stats:
                acc = system_stats.get('xgboost', {}).get('accuracy', 0.98)
                return f"The system is running optimally. Our XGBoost model currently has an accuracy of {acc*100:.2f}%."
            return "The system is running optimally. All models are initialized."
            
        if "fraud" in query and "how" in query:
            return "I detect fraud by analyzing patterns across 28 PCA-transformed features, transaction amounts, and behavioral anomalies using Isolation Forest."
            
        if "risk" in query:
            return "Risk is calculated based on probability scores from three ML models and statistical deviation from normal user behavior."
            
        responses = [
            "I'm here to help you monitor transactions. Is there anything specific you'd like to check?",
            "I can analyze patterns and identify clusters of suspicious activity. Would you like to see the latest analytics?",
            "Security is my priority. I'm currently monitoring all incoming transactions in real-time."
        ]
        
        return random.choice(responses)
