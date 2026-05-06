from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..database import db, Transaction, FraudAlert, User
from ..models.ml_models import FraudDetectionModel
import numpy as np
import datetime

transactions_bp = Blueprint('transactions', __name__)

# Global ML model instance
ml_model = FraudDetectionModel()

def initialize_ml_model():
    """Initialize the ML model (load or train)"""
    if not ml_model.models:
        if not ml_model.load_models():
            # Train new models if no saved models exist
            print("No saved models found. Training new models on real dataset...")
            df = ml_model.load_data('data/creditcard.csv')
            X, y = ml_model.preprocess_data(df)
            ml_model.train_models(X, y)
            ml_model.save_models()


def process_prediction(user_id, data):
    # Initialize ML model if needed
    initialize_ml_model()
    
    # Prepare transaction data
    transaction_data = {
        'Amount': float(data.get('amount', 0)),
        'Time': int(data.get('time', 0)),
    }
    
    # Add V1-V28 features
    for i in range(1, 29):
        if f'V{i}' in data:
            transaction_data[f'V{i}'] = data[f'V{i}']
        else:
            transaction_data[f'V{i}'] = np.random.normal(0, 1)
    
    # Get fraud prediction with enhanced insights
    prediction_result = ml_model.predict_fraud(transaction_data)
    
    # Behavior analysis for this user
    user_history = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.timestamp.desc()).limit(10).all()
    history_list = [{'Amount': t.amount, 'Merchant': t.merchant} for t in user_history]
    behavior = ml_model.analyze_user_behavior(history_list)
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        amount=float(data.get('amount', 0)),
        merchant=data.get('merchant', 'Unknown Merchant'),
        category=data.get('category', 'Other'),
        location=data.get('location', 'Unknown'),
        fraud_probability=prediction_result['fraud_probability'],
        is_fraud=prediction_result['is_fraud'],
        **{f'v{i}': transaction_data.get(f'V{i}', 0) for i in range(1, 29)}
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    # Create fraud alert if high risk or anomaly
    if prediction_result['fraud_probability'] > 50 or prediction_result['is_anomaly']:
        alert_type = 'high_risk' if prediction_result['fraud_probability'] > 80 else 'suspicious'
        if prediction_result['is_anomaly']:
            alert_type = 'anomaly'
            
        alert = FraudAlert(
            transaction_id=transaction.id,
            user_id=user_id,
            alert_type=alert_type,
            message=f"Risk Detected: ${float(data.get('amount', 0)):.2f} at {data.get('merchant', 'Unknown')}. Probability: {prediction_result['fraud_probability']:.1f}%"
        )
        db.session.add(alert)
        db.session.commit()
    
    # Get feature importance
    feature_importance = ml_model.get_feature_importance('xgboost')
    
    return {
        'transaction_id': transaction.id,
        'fraud_prediction': prediction_result,
        'behavior_analysis': behavior,
        'feature_importance': dict(list(feature_importance.items())[:5]),
        'alert_created': prediction_result['fraud_probability'] > 50 or prediction_result['is_anomaly']
    }

@transactions_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_fraud():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        print(f"Processing manual prediction for user {user_id}: {data.get('amount')} at {data.get('merchant')}")
        
        result = process_prediction(user_id, data)
        return jsonify(result), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error in predict_fraud: {str(e)}")
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/history', methods=['GET'])
@jwt_required()
def get_transaction_history():
    try:
        user_id = int(get_jwt_identity())
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        transactions = Transaction.query.filter_by(user_id=user_id)\
            .order_by(Transaction.timestamp.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'transactions': [{
                'id': t.id,
                'amount': t.amount,
                'merchant': t.merchant,
                'category': t.category,
                'location': t.location,
                'timestamp': t.timestamp.isoformat(),
                'fraud_probability': t.fraud_probability,
                'is_fraud': t.is_fraud
            } for t in transactions.items],
            'total': transactions.total,
            'pages': transactions.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/simulate', methods=['POST'])
@jwt_required()
def simulate_transaction():
    """Simulate a real-time transaction"""
    try:
        user_id = get_jwt_identity()
        
        # Generate random transaction data
        categories = ['Food', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Other']
        merchants = ['Amazon', 'Walmart', 'Starbucks', 'Uber', 'Netflix', 'Target']
        locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']
        
        # 10% chance of a high-risk simulation
        is_high_risk = np.random.random() < 0.1
        
        transaction_data = {
            'amount': float(np.random.uniform(10, 5000) if is_high_risk else np.random.uniform(5, 500)),
            'merchant': np.random.choice(merchants),
            'category': np.random.choice(categories),
            'location': np.random.choice(locations),
            'time': np.random.randint(0, 86400)
        }
        
        if is_high_risk:
            # Shift features for anomaly
            for i in range(1, 29):
                transaction_data[f'V{i}'] = np.random.normal(2, 1.5)
        else:
            for i in range(1, 29):
                transaction_data[f'V{i}'] = np.random.normal(0, 0.5)
        
        print(f"Simulating transaction for user {user_id}: {transaction_data['amount']} at {transaction_data['merchant']}")
        result = process_prediction(int(user_id), transaction_data)
        return jsonify(result), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_fraud_alerts():
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        alerts = FraudAlert.query.filter_by(user_id=user_id)\
            .order_by(FraudAlert.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'alerts': [{
                'id': a.id,
                'transaction_id': a.transaction_id,
                'alert_type': a.alert_type,
                'message': a.message,
                'created_at': a.created_at.isoformat(),
                'resolved': a.resolved,
                'transaction': {
                    'amount': a.transaction.amount,
                    'merchant': a.transaction.merchant,
                    'timestamp': a.transaction.timestamp.isoformat()
                } if a.transaction else None
            } for a in alerts.items],
            'total': alerts.total,
            'pages': alerts.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    try:
        user_id = int(get_jwt_identity())
        alert = FraudAlert.query.filter_by(id=alert_id, user_id=user_id).first()
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        alert.resolved = True
        db.session.commit()
        return jsonify({'message': 'Alert resolved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

