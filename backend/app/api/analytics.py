from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..database import db, Transaction, FraudAlert, User
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from ..utils.graph_service import GraphService
from ..utils.chatbot import FraudAssistant

analytics_bp = Blueprint('analytics', __name__)
graph_service = GraphService()
assistant = FraudAssistant()

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = int(get_jwt_identity())
        
        # Summary statistics
        stats = db.session.query(
            func.count(Transaction.id).label('total'),
            func.sum(Transaction.amount).label('total_amount'),
            func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud_count'),
            func.avg(Transaction.fraud_probability).label('avg_prob')
        ).filter_by(user_id=user_id).first()
        
        total = stats.total or 0
        fraud_count = stats.fraud_count or 0
        
        summary = {
            'total_transactions': total,
            'total_amount': float(stats.total_amount or 0),
            'fraud_transactions': fraud_count,
            'fraud_rate': (fraud_count / total * 100) if total > 0 else 0,
            'avg_fraud_probability': float(stats.avg_prob or 0),
            'risk_score': calculate_risk_score(float(stats.avg_prob or 0), fraud_count, total)
        }
        
        # Recent Alerts
        recent_alerts = FraudAlert.query.filter_by(user_id=user_id).order_by(FraudAlert.created_at.desc()).limit(5).all()
        
        # Daily trends (last 7 days)
        last_7_days = datetime.utcnow() - timedelta(days=7)
        daily_stats = db.session.query(
            func.date(Transaction.timestamp).label('date'),
            func.count(Transaction.id).label('count'),
            func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud')
        ).filter(and_(Transaction.user_id == user_id, Transaction.timestamp >= last_7_days))\
         .group_by(func.date(Transaction.timestamp)).all()
         
        return jsonify({
            'summary': summary,
            'recent_alerts': [{
                'id': a.id,
                'alert_type': a.alert_type,
                'message': a.message,
                'created_at': a.created_at.isoformat()
            } for a in recent_alerts],
            'daily_trends': [{
                'date': str(s.date),
                'count': s.count,
                'fraud': s.fraud or 0
            } for s in daily_stats],
            'category_breakdown': [] # Placeholder for category analysis
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/graph-data', methods=['GET'])
@jwt_required()
def get_graph_data():
    try:
        user_id = int(get_jwt_identity())
        # Get last 50 transactions to build graph
        transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.timestamp.desc()).limit(50).all()
        tx_list = [{
            'id': t.id,
            'amount': t.amount,
            'merchant': t.merchant,
            'category': t.category,
            'location': t.location,
            'is_fraud': t.is_fraud
        } for t in transactions]
        
        graph_service.build_transaction_graph(tx_list)
        
        # Format for React Force Graph
        nodes = []
        links = []
        
        for node, data in graph_service.G.nodes(data=True):
            nodes.append({
                'id': node,
                'amount': data.get('amount'),
                'is_fraud': data.get('is_fraud'),
                'merchant': data.get('merchant')
            })
            
        for u, v, data in graph_service.G.edges(data=True):
            links.append({
                'source': u,
                'target': v,
                'weight': data.get('weight')
            })
            
        return jsonify({
            'nodes': nodes,
            'links': links,
            'clusters': graph_service.get_fraud_clusters()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        query = data.get('query', '')
        
        # Get some context stats
        stats = db.session.query(
            func.count(Transaction.id).label('total'),
            func.avg(Transaction.fraud_probability).label('avg_prob')
        ).filter_by(user_id=user_id).first()
        
        context = {
            'total': stats.total or 0,
            'avg_prob': float(stats.avg_prob or 0)
        }
        
        response = assistant.get_response(query, system_stats={'xgboost': {'accuracy': 0.98, 'avg_prob': context['avg_prob']}})
        
        return jsonify({'response': response}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/fraud-trends', methods=['GET'])
@jwt_required()
def get_fraud_trends():
    try:
        user_id = int(get_jwt_identity())
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        hourly_stats = db.session.query(
            func.extract('hour', Transaction.timestamp).label('hour'),
            func.count(Transaction.id).label('total'),
            func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud')
        ).filter(
            and_(Transaction.user_id == user_id, Transaction.timestamp >= start_date)
        ).group_by(func.extract('hour', Transaction.timestamp)).all()
        
        probability_ranges = [
            (0, 20, 'Very Low'),
            (20, 40, 'Low'),
            (40, 60, 'Medium'),
            (60, 80, 'High'),
            (80, 100, 'Very High')
        ]
        
        distribution = []
        for min_prob, max_prob, label in probability_ranges:
            count = Transaction.query.filter(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.timestamp >= start_date,
                    Transaction.fraud_probability >= min_prob,
                    Transaction.fraud_probability < max_prob
                )
            ).count()
            
            distribution.append({
                'range': label,
                'min_probability': min_prob,
                'max_probability': max_prob,
                'count': count
            })
        
        return jsonify({
            'hourly_patterns': [{
                'hour': int(stat.hour) if stat.hour else 0,
                'total_transactions': stat.total,
                'fraud_transactions': stat.fraud or 0,
                'fraud_rate': ((stat.fraud or 0) / stat.total * 100) if stat.total > 0 else 0
            } for stat in hourly_stats],
            'probability_distribution': distribution
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/merchant-analysis', methods=['GET'])
@jwt_required()
def get_merchant_analysis():
    try:
        user_id = int(get_jwt_identity())
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        merchant_stats = db.session.query(
            Transaction.merchant,
            func.count(Transaction.id).label('transaction_count'),
            func.sum(Transaction.amount).label('total_amount'),
            func.avg(Transaction.fraud_probability).label('avg_fraud_prob'),
            func.sum(func.cast(Transaction.is_fraud, db.Integer)).label('fraud_count')
        ).filter(
            and_(Transaction.user_id == user_id, Transaction.timestamp >= start_date)
        ).group_by(Transaction.merchant)\
         .order_by(desc(func.count(Transaction.id)))\
         .limit(20).all()
        
        risky_merchants = []
        for stat in merchant_stats:
            if stat.transaction_count >= 3:
                fraud_rate = (stat.fraud_count or 0) / stat.transaction_count * 100
                if fraud_rate > 10:
                    risky_merchants.append({
                        'merchant': stat.merchant,
                        'transaction_count': stat.transaction_count,
                        'fraud_rate': fraud_rate,
                        'avg_fraud_probability': float(stat.avg_fraud_prob or 0),
                        'total_amount': float(stat.total_amount)
                    })
        
        return jsonify({
            'top_merchants': [{
                'merchant': stat.merchant,
                'transaction_count': stat.transaction_count,
                'total_amount': float(stat.total_amount),
                'avg_fraud_probability': float(stat.avg_fraud_prob or 0),
                'fraud_count': stat.fraud_count or 0,
                'fraud_rate': ((stat.fraud_count or 0) / stat.transaction_count * 100) if stat.transaction_count > 0 else 0
            } for stat in merchant_stats],
            'risky_merchants': risky_merchants[:10]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/export', methods=['GET'])
@jwt_required()
def export_data():
    try:
        user_id = int(get_jwt_identity())
        export_type = request.args.get('type', 'transactions')
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        if export_type == 'transactions':
            data = Transaction.query.filter(
                and_(Transaction.user_id == user_id, Transaction.timestamp >= start_date)
            ).all()
            
            export_data = [{
                'id': t.id,
                'amount': t.amount,
                'merchant': t.merchant,
                'category': t.category,
                'location': t.location,
                'timestamp': t.timestamp.isoformat(),
                'fraud_probability': t.fraud_probability,
                'is_fraud': t.is_fraud
            } for t in data]
            
        elif export_type == 'alerts':
            data = FraudAlert.query.filter(
                and_(FraudAlert.user_id == user_id, FraudAlert.created_at >= start_date)
            ).all()
            
            export_data = [{
                'id': a.id,
                'transaction_id': a.transaction_id,
                'alert_type': a.alert_type,
                'message': a.message,
                'created_at': a.created_at.isoformat(),
                'resolved': a.resolved
            } for a in data]
            
        else:
            total_transactions = Transaction.query.filter(
                and_(Transaction.user_id == user_id, Transaction.timestamp >= start_date)
            ).count()
            
            fraud_transactions = Transaction.query.filter(
                and_(
                    Transaction.user_id == user_id, 
                    Transaction.timestamp >= start_date,
                    Transaction.is_fraud == True
                )
            ).count()
            
            export_data = {
                'period': f'Last {days} days',
                'total_transactions': total_transactions,
                'fraud_transactions': fraud_transactions,
                'fraud_rate': (fraud_transactions / total_transactions * 100) if total_transactions > 0 else 0,
                'export_date': datetime.utcnow().isoformat()
            }
        
        return jsonify({
            'export_type': export_type,
            'period': f'Last {days} days',
            'data': export_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_risk_score(avg_fraud_prob, fraud_count, total_count):
    """Calculate overall risk score (0-100)"""
    if total_count == 0:
        return 0
    fraud_rate = (fraud_count / total_count * 100)
    risk_score = (avg_fraud_prob * 0.6) + (fraud_rate * 0.4)
    return min(100, max(0, risk_score))

