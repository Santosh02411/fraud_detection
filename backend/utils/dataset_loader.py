import pandas as pd
import numpy as np
import os
import requests

class DatasetLoader:
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
    def get_dataset(self, filename='creditcard.csv'):
        """Load the dataset or return None if not found"""
        path = os.path.join(self.data_dir, filename)
        if os.path.exists(path):
            return pd.read_csv(path)
        return None
        
    def download_sample_data(self):
        """
        Placeholder for downloading real-world data.
        In a real scenario, this would use Kaggle API or a direct link.
        For now, it returns instructions or generates a small subset.
        """
        # Note: The 'creditcard.csv' dataset is large (~150MB).
        # We usually expect the user to provide it or use synthetic data.
        pass

    def get_summary_stats(self, df):
        """Return summary statistics of the dataset"""
        if df is None:
            return {}
            
        stats = {
            "total_transactions": len(df),
            "fraud_count": int(df['Class'].sum()),
            "normal_count": int(len(df) - df['Class'].sum()),
            "fraud_percentage": float((df['Class'].sum() / len(df)) * 100),
            "avg_amount": float(df['Amount'].mean())
        }
        return stats
