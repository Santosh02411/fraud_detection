from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..database import db, Transaction, FraudAlert, User
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Check if current user is admin"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        users = User.query.order_by(User.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # Get stats for each user
        user_stats = []
        for user in users.items:
            total_transactions = Transaction.query.filter_by(user_id=user.id).count()
            fraud_transactions = Transaction.query.filter(
                and_(Transaction.user_id==user.id, Transaction.is_fraud == True)
            ).count()
            
            user_stats.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat(),
                'total_transactions': total_transactions,
                'fraud_transactions': fraud_transactions,
                'fraud_rate': (fraud_transactions / total_transactions * 100) if total_transactions > 0 else 0
            })
        
        return jsonify({
            'users': user_stats,
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_admin_overview():
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Time filters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # System-wide stats
        total_users = User.query.count()
        total_transactions = Transaction.query.filter(Transaction.timestamp >= start_date).count()
        total_amount = Transaction.query.filter(Transaction.timestamp >= start_date)\
            .with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        fraud_transactions = Transaction.query.filter(
            and_(Transaction.timestamp >= start_date, Transaction.is_fraud == True)
        ).count()
        
        fraud_amount = Transaction.query.filter(
            and_(Transaction.timestamp >= start_date, Transaction.is_fraud == True)
        ).with_entities(func.sum(Transaction.amount)).scalar() or 0
        
        total_alerts = FraudAlert.query.filter(FraudAlert.created_at >= start_date).count()
        unresolved_alerts = FraudAlert.query.filter(
            and_(FraudAlert.created_at >= start_date, FraudAlert.resolved == False)
        ).count()
        
        # Recent activity
        recent_transactions = Transaction.query.filter(
            Transaction.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(Transaction.timestamp.desc()).limit(10).all()
        
        recent_alerts = FraudAlert.query.filter(
            FraudAlert.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(FraudAlert.created_at.desc()).limit(10).all()
        
        # Top risky users
        risky_users = db.session.query(
            User.id,
            User.username,
            User.email,
            func.count(Transaction.id).label('total_transactions'),
            func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud_transactions')
        ).join(Transaction, User.id == Transaction.user_id)\
         .filter(Transaction.timestamp >= start_date)\
         .group_by(User.id)\
         .having(func.count(Transaction.id) >= 5)\
         .order_by(desc(
             (func.sum(func.cast(Transaction.is_fraud, db.Integer)) / func.count(Transaction.id))
         )).limit(10).all()
        
        return jsonify({
            'system_stats': {
                'total_users': total_users,
                'total_transactions': total_transactions,
                'total_amount': float(total_amount),
                'fraud_transactions': fraud_transactions,
                'fraud_amount': float(fraud_amount),
                'fraud_rate': (fraud_transactions / total_transactions * 100) if total_transactions > 0 else 0,
                'total_alerts': total_alerts,
                'unresolved_alerts': unresolved_alerts
            },
            'recent_transactions': [{
                'id': t.id,
                'user_id': t.user_id,
                'amount': t.amount,
                'merchant': t.merchant,
                'timestamp': t.timestamp.isoformat(),
                'fraud_probability': t.fraud_probability,
                'is_fraud': t.is_fraud
            } for t in recent_transactions],
            'recent_alerts': [{
                'id': a.id,
                'user_id': a.user_id,
                'transaction_id': a.transaction_id,
                'alert_type': a.alert_type,
                'message': a.message,
                'created_at': a.created_at.isoformat(),
                'resolved': a.resolved
            } for a in recent_alerts],
            'risky_users': [{
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'total_transactions': user.total_transactions,
                'fraud_transactions': user.fraud_transactions or 0,
                'fraud_rate': ((user.fraud_transactions or 0) / user.total_transactions * 100) if user.total_transactions > 0 else 0
            } for user in risky_users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_all_transactions():
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        fraud_only = request.args.get('fraud_only', 'false').lower() == 'true'
        
        query = Transaction.query
        if fraud_only:
            query = query.filter(Transaction.is_fraud == True)
        
        transactions = query.order_by(Transaction.timestamp.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'transactions': [{
                'id': t.id,
                'user_id': t.user_id,
                'username': User.query.get(t.user_id).username if User.query.get(t.user_id) else 'Unknown',
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

@admin_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_all_alerts():
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unresolved_only = request.args.get('unresolved_only', 'false').lower() == 'true'
        
        query = FraudAlert.query
        if unresolved_only:
            query = query.filter(FraudAlert.resolved == False)
        
        alerts = query.order_by(FraudAlert.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'alerts': [{
                'id': a.id,
                'user_id': a.user_id,
                'username': User.query.get(a.user_id).username if User.query.get(a.user_id) else 'Unknown',
                'transaction_id': a.transaction_id,
                'alert_type': a.alert_type,
                'message': a.message,
                'created_at': a.created_at.isoformat(),
                'resolved': a.resolved,
                'transaction': {
                    'amount': a.transaction.amount,
                    'merchant': a.transaction.merchant,
                    'fraud_probability': a.transaction.fraud_probability
                } if a.transaction else None
            } for a in alerts.items],
            'total': alerts.total,
            'pages': alerts.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def admin_resolve_alert(alert_id):
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        alert = FraudAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        alert.resolved = True
        db.session.commit()
        
        return jsonify({'message': 'Alert resolved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-role', methods=['PUT'])
@jwt_required()
def toggle_user_role(user_id):
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Toggle role
        user.role = 'admin' if user.role == 'user' else 'user'
        db.session.commit()
        
        return jsonify({
            'message': f'User role updated to {user.role}',
            'new_role': user.role
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system-health', methods=['GET'])
@jwt_required()
def get_system_health():
    try:
        if not require_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Database stats
        db_stats = {
            'total_users': User.query.count(),
            'total_transactions': Transaction.query.count(),
            'total_alerts': FraudAlert.query.count(),
            'storage_size': 'N/A'  # Would need actual file system check
        }
        
        # Recent activity metrics
        last_hour = datetime.utcnow() - timedelta(hours=1)
        last_24h = datetime.utcnow() - timedelta(hours=24)
        
        activity_metrics = {
            'transactions_last_hour': Transaction.query.filter(Transaction.timestamp >= last_hour).count(),
            'transactions_last_24h': Transaction.query.filter(Transaction.timestamp >= last_24h).count(),
            'alerts_last_hour': FraudAlert.query.filter(FraudAlert.created_at >= last_hour).count(),
            'alerts_last_24h': FraudAlert.query.filter(FraudAlert.created_at >= last_24h).count(),
            'fraud_rate_last_24h': 0
        }
        
        # Calculate fraud rate for last 24h
        total_24h = activity_metrics['transactions_last_24h']
        fraud_24h = Transaction.query.filter(
            and_(Transaction.timestamp >= last_24h, Transaction.is_fraud == True)
        ).count()
        
        if total_24h > 0:
            activity_metrics['fraud_rate_last_24h'] = (fraud_24h / total_24h * 100)
        
        return jsonify({
            'database_stats': db_stats,
            'activity_metrics': activity_metrics,
            'system_status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
