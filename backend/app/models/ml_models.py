import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import os
from pathlib import Path

class FraudDetectionModel:
    def __init__(self):
        self.models = None
        self.scaler = None
        self.model_dir = Path(__file__).parent.parent / 'models'
        self.model_dir.mkdir(exist_ok=True)
        self.rf_model_path = self.model_dir / 'random_forest_model.pkl'
        self.lr_model_path = self.model_dir / 'logistic_regression_model.pkl'
        self.scaler_path = self.model_dir / 'scaler.pkl'
    
    def load_data(self, filepath=None):
        """Load or generate training data"""
        if filepath:
            return pd.read_csv(filepath)
        else:
            # Generate synthetic fraud detection data
            np.random.seed(42)
            n_samples = 1000
            
            # Features: V1-V28 (PCA components) + Amount + Time
            features = np.random.randn(n_samples, 28)  # V1-V28
            amount = np.random.exponential(scale=100, size=n_samples)
            time = np.random.randint(0, 172800, size=n_samples)  # 0-2 days in seconds
            
            X = np.column_stack([features, amount, time])
            
            # Generate labels (80% legitimate, 20% fraud)
            y = np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2])
            
            # Create DataFrame
            columns = [f'V{i}' for i in range(1, 29)] + ['Amount', 'Time']
            df = pd.DataFrame(X, columns=columns)
            df['Class'] = y
            
            return df
    
    def preprocess_data(self, df):
        """Preprocess data for model training"""
        X = df.drop('Class', axis=1)
        y = df['Class']
        
        # Initialize and fit scaler
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def train_models(self, X, y):
        """Train fraud detection models"""
        # Train Random Forest
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X, y)
        
        # Train Logistic Regression
        lr_model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            n_jobs=-1
        )
        lr_model.fit(X, y)
        
        self.models = {
            'random_forest': rf_model,
            'logistic_regression': lr_model
        }
    
    def save_models(self):
        """Save trained models to disk"""
        if self.models:
            with open(self.rf_model_path, 'wb') as f:
                pickle.dump(self.models['random_forest'], f)
            
            with open(self.lr_model_path, 'wb') as f:
                pickle.dump(self.models['logistic_regression'], f)
            
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            print(f"Models saved to {self.model_dir}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            if self.rf_model_path.exists() and self.lr_model_path.exists():
                with open(self.rf_model_path, 'rb') as f:
                    rf_model = pickle.load(f)
                
                with open(self.lr_model_path, 'rb') as f:
                    lr_model = pickle.load(f)
                
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                
                self.models = {
                    'random_forest': rf_model,
                    'logistic_regression': lr_model
                }
                print("Models loaded from disk")
                return True
            return False
        except Exception as e:
            print(f"Error loading models: {e}")
            return False
    
    def predict_fraud(self, transaction_data):
        """Predict fraud probability for a transaction"""
        if not self.models or not self.scaler:
            return {'fraud_probability': 0.5, 'is_fraud': False, 'confidence': 0.0}
        
        try:
            # Prepare features in order: V1-V28, Amount, Time
            features = []
            for i in range(1, 29):
                features.append(transaction_data.get(f'V{i}', np.random.normal(0, 1)))
            features.append(transaction_data.get('Amount', 0))
            features.append(transaction_data.get('Time', 0))
            
            X = np.array([features])
            X_scaled = self.scaler.transform(X)
            
            # Get predictions from both models
            rf_pred_proba = self.models['random_forest'].predict_proba(X_scaled)[0]
            lr_pred_proba = self.models['logistic_regression'].predict_proba(X_scaled)[0]
            
            # Average the probabilities
            fraud_probability = (rf_pred_proba[1] + lr_pred_proba[1]) / 2
            
            # Determine if fraud (threshold = 0.5)
            is_fraud = fraud_probability > 0.5
            
            return {
                'fraud_probability': float(fraud_probability),
                'is_fraud': bool(is_fraud),
                'confidence': float(max(rf_pred_proba[1], lr_pred_proba[1]))
            }
        
        except Exception as e:
            print(f"Error in fraud prediction: {e}")
            return {'fraud_probability': 0.5, 'is_fraud': False, 'confidence': 0.0}
