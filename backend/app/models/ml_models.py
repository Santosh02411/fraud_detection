import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import joblib
import os

class FraudDetectionModel:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.model_performance = {}
    
    def load_data(self, data_path):
        """Load and preprocess the credit card fraud dataset"""
        try:
            df = pd.read_csv(data_path)
            return df
        except FileNotFoundError:
            # Generate synthetic data if no dataset is available
            return self.generate_synthetic_data()
    
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic fraud detection data for demonstration"""
        np.random.seed(42)
        
        # Generate features similar to credit card dataset
        data = {}
        for i in range(1, 29):
            data[f'V{i}'] = np.random.normal(0, 1, n_samples)
        
        # Amount feature
        data['Amount'] = np.random.exponential(100, n_samples)
        data['Amount'] = np.clip(data['Amount'], 1, 10000)
        
        # Generate imbalanced labels (2% fraud)
        fraud_ratio = 0.02
        n_fraud = int(n_samples * fraud_ratio)
        data['Class'] = np.zeros(n_samples)
        fraud_indices = np.random.choice(n_samples, n_fraud, replace=False)
        data['Class'][fraud_indices] = 1
        
        # Make fraud transactions have different patterns
        for idx in fraud_indices:
            # Higher amounts for fraud
            data['Amount'][idx] *= np.random.uniform(1.5, 5.0)
            # Different feature patterns
            for i in range(1, 29):
                if np.random.random() > 0.5:
                    data[f'V{i}'][idx] += np.random.normal(2, 1)
        
        df = pd.DataFrame(data)
        return df
    
    def preprocess_data(self, df):
        """Preprocess the data for training"""
        # Separate features and target
        X = df.drop('Class', axis=1)
        y = df['Class']
        
        # Store feature columns for later use
        self.feature_columns = X.columns.tolist()
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def handle_imbalance(self, X, y):
        """Handle class imbalance using SMOTE"""
        smote = SMOTE(random_state=42)
        X_resampled, y_resampled = smote.fit_resample(X, y)
        return X_resampled, y_resampled
    
    def train_models(self, X, y):
        """Train multiple ML models"""
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Handle imbalance in training data
        X_train_balanced, y_train_balanced = self.handle_imbalance(X_train, y_train)
        
        # Train Logistic Regression
        print("Training Logistic Regression...")
        lr_model = LogisticRegression(random_state=42, max_iter=1000)
        lr_model.fit(X_train_balanced, y_train_balanced)
        self.models['logistic_regression'] = lr_model
        
        # Train Random Forest
        print("Training Random Forest...")
        rf_model = RandomForestClassifier(
            n_estimators=100, 
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train_balanced, y_train_balanced)
        self.models['random_forest'] = rf_model
        
        # Train XGBoost
        print("Training XGBoost...")
        xgb_model = xgb.XGBClassifier(
            random_state=42,
            n_estimators=100,
            learning_rate=0.1
        )
        xgb_model.fit(X_train_balanced, y_train_balanced)
        self.models['xgboost'] = xgb_model
        
        # Evaluate models
        self.evaluate_models(X_test, y_test)
        
        return X_test, y_test
    
    def evaluate_models(self, X_test, y_test):
        """Evaluate all trained models"""
        for name, model in self.models.items():
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            self.model_performance[name] = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred),
                'recall': recall_score(y_test, y_pred),
                'f1_score': f1_score(y_test, y_pred),
                'predictions': y_pred,
                'probabilities': y_pred_proba
            }
            
            print(f"\n{name} Performance:")
            print(f"Accuracy: {self.model_performance[name]['accuracy']:.4f}")
            print(f"Precision: {self.model_performance[name]['precision']:.4f}")
            print(f"Recall: {self.model_performance[name]['recall']:.4f}")
            print(f"F1-Score: {self.model_performance[name]['f1_score']:.4f}")
    
    def save_models(self, model_dir='models'):
        """Save trained models"""
        os.makedirs(model_dir, exist_ok=True)
        
        for name, model in self.models.items():
            model_path = os.path.join(model_dir, f'{name}.pkl')
            joblib.dump(model, model_path)
        
        # Save scaler
        scaler_path = os.path.join(model_dir, 'scaler.pkl')
        joblib.dump(self.scaler, scaler_path)
        
        # Save feature columns
        feature_path = os.path.join(model_dir, 'feature_columns.pkl')
        joblib.dump(self.feature_columns, feature_path)
        
        # Save performance metrics
        performance_path = os.path.join(model_dir, 'performance.pkl')
        joblib.dump(self.model_performance, performance_path)
    
    def load_models(self, model_dir='models'):
        """Load pre-trained models"""
        try:
            for name in ['logistic_regression', 'random_forest', 'xgboost']:
                model_path = os.path.join(model_dir, f'{name}.pkl')
                if os.path.exists(model_path):
                    self.models[name] = joblib.load(model_path)
            
            # Load scaler
            scaler_path = os.path.join(model_dir, 'scaler.pkl')
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            
            # Load feature columns
            feature_path = os.path.join(model_dir, 'feature_columns.pkl')
            if os.path.exists(feature_path):
                self.feature_columns = joblib.load(feature_path)
            
            # Load performance metrics
            performance_path = os.path.join(model_dir, 'performance.pkl')
            if os.path.exists(performance_path):
                self.model_performance = joblib.load(performance_path)
            
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False
    
    def predict_fraud(self, transaction_data, model_name='xgboost'):
        """Predict fraud probability for a single transaction"""
        # Use requested model if available, otherwise fallback to first available model
        if model_name not in self.models:
            if self.models:
                model_name = list(self.models.keys())[0]  # Use first available model
            else:
                raise ValueError("No models loaded or trained. Please initialize models first.")
        
        model = self.models[model_name]
        
        # Ensure the data has the right features
        if isinstance(transaction_data, dict):
            # Convert dict to DataFrame
            df = pd.DataFrame([transaction_data])
            # Reorder columns to match training data
            df = df[self.feature_columns]
        else:
            df = transaction_data
        
        # Scale the features
        scaled_data = self.scaler.transform(df)
        
        # Get prediction and probability
        prediction = model.predict(scaled_data)[0]
        probability = model.predict_proba(scaled_data)[0, 1]
        
        return {
            'is_fraud': bool(prediction),
            'fraud_probability': float(probability * 100),  # Convert to percentage
            'is_anomaly': float(probability * 100) > 70,  # Anomaly if probability > 70%
            'model_used': model_name
        }
    
    def get_feature_importance(self, model_name='random_forest'):
        """Get feature importance for explainable AI"""
        # Fallback to available model if requested model not found
        if model_name not in self.models:
            if not self.models:
                return {}
            model_name = list(self.models.keys())[0]
        
        model = self.models[model_name]
        
        # Check if model has feature_importances_ attribute
        if not hasattr(model, 'feature_importances_'):
            return {}
        
        importances = model.feature_importances_
        feature_importance = dict(zip(self.feature_columns, importances))
        # Sort by importance
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
        
        return feature_importance
    
    def analyze_user_behavior(self, transaction_history):
        """Analyze user's historical behavior for anomaly detection"""
        if not transaction_history:
            return {
                'avg_transaction_amount': 0,
                'transaction_count': 0,
                'behavior_pattern': 'insufficient_data',
                'anomaly_score': 0
            }
        
        amounts = [t.get('Amount', 0) for t in transaction_history]
        avg_amount = np.mean(amounts) if amounts else 0
        std_amount = np.std(amounts) if len(amounts) > 1 else 0
        
        return {
            'avg_transaction_amount': float(avg_amount),
            'std_transaction_amount': float(std_amount),
            'transaction_count': len(transaction_history),
            'behavior_pattern': 'normal' if len(amounts) > 5 else 'developing',
            'anomaly_score': 0  # Placeholder for more sophisticated anomaly detection
        }
