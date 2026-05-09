from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .database import init_db
import os

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-string')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fraud_detection.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    
    # Initialize database
    init_db(app)
    
    # Initialize ML models on startup
    with app.app_context():
        try:
            from .models.ml_models import FraudDetectionModel
            ml_model = FraudDetectionModel()
            
            print("Initializing ML models on startup...")
            if not ml_model.load_models():
                print("No saved models found. Training new models...")
                df = ml_model.load_data(None)  # Generate synthetic data
                X, y = ml_model.preprocess_data(df)
                ml_model.train_models(X, y)
                ml_model.save_models()
                print("✓ Models trained and saved successfully!")
            else:
                print("✓ Models loaded successfully!")
        except Exception as e:
            print(f"Warning: Could not initialize ML models on startup: {e}")
    
    # Register blueprints
    from .api.auth import auth_bp
    from .api.transactions import transactions_bp
    from .api.analytics import analytics_bp
    from .api.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    return app
